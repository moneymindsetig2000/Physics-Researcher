import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { GEMINI_API_KEY, CANDIDATE_POOL_SIZE, MAX_CONTEXT_MEMORIES, RELEVANCE_THRESHOLD } from "./config";
import type { MemoryRecord, TraceRecord } from "./types";
import { rankMemories, formatSystemInstruction } from "../pipeline/pipeline";

/**
 * Initialize and return the GoogleGenAI client lazily.
 */
export function getAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * Helper to check if a valid API key has been provided.
 */
export function isApiKeyConfigured(): boolean {
  return GEMINI_API_KEY !== "PASTE_YOUR_API_KEY_HERE" && GEMINI_API_KEY.trim() !== "";
}

/**
 * Executes an asynchronous Gemini API task with exponential backoff retry on 500 and 503 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 4, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error);
    const isRetryable = errorStr.includes("500") || errorStr.includes("503") || errorStr.includes("demand") || errorStr.includes("INTERNAL") || errorStr.includes("UNAVAILABLE") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("429");
    if (retries > 0 && isRetryable) {
      console.warn(`Temporary API error encountered. Retrying in ${delay}ms... (${retries} retries left). Error:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generate embedding for a given text using gemini-embedding-2-preview
 */
export async function embedText(
  text: string,
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
  const ai = getAIClient();
  const response = await callWithRetry(() => ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: text,
    config: { taskType }
  }));

  if (response.embeddings?.[0]?.values) {
    return response.embeddings[0].values;
  }
  throw new Error("No embedding values returned from Gemini API");
}

export interface PipelineResult {
  replyText: string;
  trace: TraceRecord;
  newMemoryCreated?: MemoryRecord;
  deletedMemoryId?: string;
}

/**
 * Execute the 10-step memory-retrieval and LLM pipeline sequentially
 */
export async function runQueryPipeline(
  userQuery: string,
  memories: MemoryRecord[],
  mode: 'fast' | 'thinking' | 'deep' = 'thinking',
  chatHistory: { sender: 'user' | 'ai'; text: string }[] = []
): Promise<PipelineResult> {
  const ai = getAIClient();

  // STEP 1 — Reasoning Decision (Gemma 4 31B naturally decides if long-term memory is required)
  let memoryRequired = false;
  let decisionReason = "";

  try {
    const decisionResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: `User Message:
"${userQuery}"

Task:

Determine whether retrieving long-term memory would meaningfully improve the quality of the response.

Long-term memory may contain information such as:

- User preferences
- Preferred explanation style
- Preferred mathematical depth
- Citation preferences
- Formatting preferences
- Writing preferences
- Ongoing research projects
- Previously stored research notes
- Previous conversations
- Any other durable information intentionally saved for future use

Your objective is NOT to determine whether the user is asking a follow-up question.

Instead, determine whether retrieving stored memories would produce a noticeably better, more personalized, more consistent, or more context-aware response.

Memory SHOULD be retrieved whenever it is likely to improve:

- Explanation style
- Mathematical detail
- Formatting
- Citation style
- Personalization
- Research continuity
- Ongoing projects
- Previously discussed work
- Any response that benefits from remembering the user

Examples where memory is usually REQUIRED:

- Explaining physics concepts
  (Saved explanation preferences may improve the answer.)

- Solving mathematical or physics problems
  (Saved derivation or formatting preferences may improve the response.)

- Summarizing research papers
  (Saved summary style or citation preferences may improve the output.)

- Literature reviews

- Research discussions

- Questions about ongoing projects

- Follow-up requests

- "Continue", "Keep going", or similar requests

- Requests referencing previous conversations

- Requests involving saved preferences

- Requests where long-term context would noticeably improve the final response.

Memory is usually NOT required when:

- Greetings
  (e.g. "Hi", "Hello", "Good morning")

- Casual conversation
  (e.g. "How are you?", "What's your name?")

- Very simple arithmetic
  (e.g. "2 + 2", "15% of 80")

- Extremely short factual questions where personalization would not change the answer.

- Requests that are completely self-contained AND would produce essentially the same response regardless of any stored memories.

Decision Rules:

1. Do NOT retrieve memory simply because memories exist.

2. Do NOT retrieve memory for every request.

3. Retrieve memory whenever it would improve personalization, continuity, explanation quality, or research assistance.

4. If retrieved memories would noticeably improve the response, return memoryRequired = true.

5. If the response would be essentially identical without memory, return memoryRequired = false.

6. When uncertain, ask yourself:
   "Would retrieving long-term memory make this response better for this specific user?"

   If YES → memoryRequired = true

   If NO → memoryRequired = false

Respond ONLY as a JSON object:

{
  "memoryRequired": boolean,
  "reason": "A concise 1–2 sentence explanation describing why memory retrieval would or would not improve the response."
}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            memoryRequired: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["memoryRequired", "reason"]
        }
      }
    }));

    if (decisionResponse.text) {
      const parsed = JSON.parse(decisionResponse.text.trim());
      memoryRequired = !!parsed.memoryRequired;
      decisionReason = parsed.reason || "Evaluated request context.";
    }
  } catch (error) {
    console.error("Error making memory requirement reasoning decision:", error);
    // Fallback to true to be safe
    memoryRequired = true;
    decisionReason = "Fallback due to decision error.";
  }

  // Retrieval pipeline variables
  let queryVector: number[] = [];
  let scoredList: any[] = [];
  let candidatePool: any[] = [];
  let eligibleCandidates: any[] = [];
  let finalSurvivingMemories: MemoryRecord[] = [];
  let rerankerTable: any[] = [];
  let finalContextSelection: any[] = [];
  let builtSystemInstruction = "";

  if (memoryRequired) {
    // Step 1: Embed the user's query
    queryVector = await embedText(userQuery, "RETRIEVAL_QUERY");

    // Steps 2-6: Rank memories (Semantic search, keyword overlap, score fusion, importance/recency boosts, filtering)
    const rankResult = rankMemories(userQuery, queryVector, memories);
    scoredList = rankResult.scoredList;
    candidatePool = rankResult.candidatePool;

    // NEW STEP: LLM Relevance Reranker (evaluated in ThinkingLevel.MINIMAL, independently and in parallel on candidate pool only)
    const rerankerPromises = candidatePool.map(async (item) => {
      const mem = item.memory;
      const finalRankScore = item.finalRankScore;
      try {
        const prompt = `User Query:
"${userQuery}"

Candidate Memory:
Title:
${mem.title}

Category:
${mem.category}

Description:
${mem.description}

Memory:
${mem.memory}

Task:

Determine whether this memory should be included in Jessie's active context for answering the current user request.

Only evaluate THIS single memory.

A memory is considered relevant only if including it would genuinely improve the quality, accuracy, personalization, continuity, formatting, reasoning, or completeness of the current response.

Think carefully before approving a memory. A false positive is worse than a false negative because unnecessary memories increase context size, cost, and may influence the final answer in unwanted ways.

Respond ONLY as valid JSON.

Schema:
{
  "relevant": boolean,
  "confidence": number,
  "reason": string
}

Evaluation Rules:

1. User Preferences
- Always mark as relevant if the preference changes how Jessie should answer.
- Examples:
  - explanation style
  - citation format
  - response formatting
  - mathematical detail
  - language preference
  - teaching style

2. Ongoing Projects
- Only relevant if the current request directly relates to that project.
- Similar scientific fields alone are NOT enough.
- Example:
  User project: Graphene superconductivity
  User asks: "Find recent graphene superconductivity papers."
  → Relevant

  User asks: "Explain Quantum Hall Effect."
  → NOT relevant

3. Research Notes
- Only include if they provide useful context that materially improves the current answer.
- Do NOT include unrelated notes simply because they belong to physics.

4. Conversation Continuity
- If the user references previous work using phrases such as:
  - continue
  - previous
  - earlier
  - remember
  - same project
  - that paper
  - our discussion
then related memories are relevant.

5. Personal Facts
- Include only if they affect the current request.

6. Broad Domain Matching
- NEVER approve a memory simply because it belongs to physics, science, engineering, mathematics, or another subject area.

7. Similar Vocabulary
- Shared words alone do NOT make a memory relevant.
- The underlying intent of the user's request must match the purpose of the memory.

8. Cost Awareness
- Prefer the minimum number of memories required.
- If this memory provides no measurable benefit, reject it.

9. Independent Evaluation
- Ignore all other memories.
- Judge only this candidate against the current user query.

Return ONLY the JSON object. Do not include markdown, explanations, or additional text.`;

        const res = await callWithRetry(() => ai.models.generateContent({
          model: "gemma-4-31b-it",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                relevant: { type: "boolean" },
                confidence: { type: "number" },
                reason: { type: "string" }
              },
              required: ["relevant", "confidence", "reason"]
            }
          }
        }));

        if (res.text) {
          const parsed = JSON.parse(res.text.trim());
          return {
            memory: mem,
            finalRankScore,
            relevant: !!parsed.relevant,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 1.0,
            reason: parsed.reason || "Processed successfully."
          };
        }
      } catch (error) {
        console.error(`Error reranking memory "${mem.title}":`, error);
      }
      return {
        memory: mem,
        finalRankScore,
        relevant: false,
        confidence: 0,
        reason: "LLM Reranker encountered an evaluation error or returned invalid output."
      };
    });

    const rerankerResults = await Promise.all(rerankerPromises);

    // Filter: must satisfy BOTH conditions:
    // 1. finalRankScore >= RELEVANCE_THRESHOLD
    // 2. LLM reranker returned relevant = true
    eligibleCandidates = rerankerResults.filter(r => r.relevant && r.finalRankScore >= RELEVANCE_THRESHOLD);

    // Sort by confidence (highest first), then finalRankScore (highest first)
    const sortedEligible = [...eligibleCandidates].sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.finalRankScore - a.finalRankScore;
    });

    // Limit to MAX_CONTEXT_MEMORIES
    const finalSurvivingCandidates = sortedEligible.slice(0, MAX_CONTEXT_MEMORIES);
    finalSurvivingMemories = finalSurvivingCandidates.map(c => c.memory);

    rerankerTable = rerankerResults.map(res => {
      const isFinallyInjected = finalSurvivingMemories.some(m => m.id === res.memory.id);
      return {
        title: res.memory.title,
        relevant: res.relevant,
        confidence: res.confidence,
        reason: res.reason,
        status: (isFinallyInjected ? 'Included' : 'Removed') as 'Included' | 'Removed'
      };
    });

    finalContextSelection = finalSurvivingCandidates.map((c, idx) => ({
      rank: idx + 1,
      title: c.memory.title,
      confidence: c.confidence,
      finalScore: c.finalRankScore
    }));

    // Step 7: Format system instruction using surviving memories
    builtSystemInstruction = formatSystemInstruction(finalSurvivingMemories);
  } else {
    // Skipped
    builtSystemInstruction = "";
  }

  // Step 8: Call the main reasoning model with web search grounding
  const mainModel = "gemma-4-31b-it";

  // Build full content array including history for conversational context
  const apiContents: any[] = [];
  for (const turn of chatHistory) {
    if (turn.text && turn.text.trim()) {
      apiContents.push({
        role: turn.sender === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }]
      });
    }
  }
  apiContents.push({
    role: 'user',
    parts: [{ text: userQuery }]
  });

  const mainResponse = await callWithRetry(() => ai.models.generateContent({
    model: mainModel,
    contents: apiContents,
    config: {
      // Structured Content object with explicit role:'system' — required by Gemma API to prevent 500 errors
      systemInstruction: builtSystemInstruction
        ? { role: 'system', parts: [{ text: builtSystemInstruction }] }
        : undefined,
      tools: [{ googleSearch: {} }],
      thinkingConfig: {
        thinkingLevel: mode === 'fast' ? ThinkingLevel.MINIMAL : ThinkingLevel.HIGH
      }
    }
  }));

  const replyText = mainResponse.text || "No response text generated by the model.";

  // Extract Grounding Metadata
  const groundingMetadata = mainResponse.candidates?.[0]?.groundingMetadata;
  const searchQueries = groundingMetadata?.webSearchQueries || [];
  const searchSources = groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title || chunk.web?.uri || "Web Source",
    uri: chunk.web?.uri || ""
  })).filter(src => src.uri !== "") || [];
  const searchUsed = !!(searchQueries.length > 0 || searchSources.length > 0);

  // Step 9: Memory Evaluation (Using ThinkingLevel.MINIMAL to keep latency low)
  let evalResult = {
    shouldSave: false,
    shouldDelete: false,
    deleteMemoryTitle: "",
    reason: "No evaluation processed."
  };
  let newMemoryCreated: any = undefined;
  let deletedMemoryId: string | undefined = undefined;

  try {
    const memorySummaryText = memories.map(m => `- ID: "${m.id}", Title: "${m.title}", Memory content: "${m.memory}"`).join("\n");
    const evalResponse = await callWithRetry(() => ai.models.generateContent({
      model: mainModel,
      contents: `User said:
"${userQuery}"

Assistant replied:
"${replyText}"

All existing memories currently stored in the memory bank:
${memorySummaryText || "None"}

You are Jessie's Long-Term Memory Manager.

Your responsibility is to decide whether this conversation should modify Jessie's long-term memory.

Long-term memory should contain only durable information that is likely to improve future conversations.

Tasks:

1. Determine whether a NEW memory should be created.
2. Determine whether an EXISTING memory should be deleted.
3. If neither action is required, leave both as false.
4. Explain your decision briefly in the "reason" field.

A memory SHOULD be saved only if the user provides durable information such as:

• Long-term preferences
  Examples:
  - "Always explain equations step-by-step."
  - "Use APS citations."
  - "Answer in simple English."
  - "From now on..."

• Ongoing research projects
  Examples:
  - "I'm working on graphene superconductivity."
  - "My thesis is about plasma physics."

• Long-term personal working context
  Examples:
  - Preferred formatting
  - Writing style
  - Citation style
  - Teaching preference
  - Permanent workflow instructions

A memory should NOT be saved for:

• Greetings
• One-time questions
• Temporary requests
• Single explanations
• Short conversations
• Information already contained in existing memories
• Facts that are only relevant to the current conversation
• Assistant-generated content
• Web search results
• Temporary research findings

Before saving a memory:

- Compare it against the existing memory list.
- If an equivalent memory already exists, do NOT create a duplicate.
- If the new information updates an existing memory, prefer replacing or deleting the old version instead of creating multiple conflicting memories.

Deletion Rules:

Delete a memory ONLY if the user explicitly requests it.

Examples:
- "Forget my citation preference."
- "Delete my graphene project."
- "Remove my explanation preference."

Never delete memories automatically.
Never infer deletion from context.

If deletion is requested, set deleteMemoryTitle to the EXACT memory title or ID from the memory list above.

If shouldSave is true, generate:

- title
- description
- category
- memory
- importance (0-10)

Guidelines for generated memory fields:

title:
A short unique title.

description:
One concise sentence describing the memory.

category:
Examples:
- User Preference
- Research Project
- Research Notes
- Writing Preference
- Citation Preference
- Other

memory:
Store only the durable information itself.
Do not include unnecessary wording.

importance:
0–3 = Low future value
4–6 = Useful
7–8 = Important
9–10 = Critical long-term preference or project

Respond ONLY as valid JSON matching the required schema.
Do not include markdown or any additional explanation.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            shouldSave: { type: "boolean" },
            shouldDelete: { type: "boolean" },
            deleteMemoryTitle: { type: "string" },
            reason: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            memory: { type: "string" },
            importance: { type: "number" }
          },
          required: ["shouldSave", "shouldDelete", "reason"]
        }
      }
    }));

    if (evalResponse.text) {
      const parsed = JSON.parse(evalResponse.text.trim());
      evalResult = {
        shouldSave: !!parsed.shouldSave,
        shouldDelete: !!parsed.shouldDelete,
        deleteMemoryTitle: parsed.deleteMemoryTitle || "",
        reason: parsed.reason || ""
      };

      if (evalResult.shouldDelete && evalResult.deleteMemoryTitle) {
        const queryClean = evalResult.deleteMemoryTitle.trim().toLowerCase();
        const matched = memories.find(m =>
          m.id.toLowerCase() === queryClean ||
          m.title.toLowerCase() === queryClean ||
          m.title.toLowerCase().includes(queryClean) ||
          queryClean.includes(m.title.toLowerCase())
        );
        if (matched) {
          deletedMemoryId = matched.id;
        }
      }

      if (evalResult.shouldSave && parsed.memory) {
        const memoryVector = await embedText(parsed.memory, "RETRIEVAL_DOCUMENT");
        const randomIdSuffix = typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).substring(2, 10);

        newMemoryCreated = {
          id: "mem_" + randomIdSuffix,
          title: parsed.title || "User Preference Note",
          description: parsed.description || "Inferred from conversation.",
          category: parsed.category || "General",
          memory: parsed.memory,
          importance: typeof parsed.importance === 'number' ? Math.max(0, Math.min(10, parsed.importance)) : 5,
          createdAt: Date.now(),
          embedding: memoryVector
        };
      }
    }
  } catch (err) {
    console.error("Memory evaluation step encountered an error:", err);
    evalResult.reason = "Evaluation step error: " + (err instanceof Error ? err.message : String(err));
  }

  // Construct the trace record to return to UI
  const trace: TraceRecord = {
    queryText: userQuery,
    queryEmbeddingLength: queryVector.length,
    retrievalTable: scoredList,
    systemInstructionSent: builtSystemInstruction,
    searchUsed,
    searchQueries,
    searchSources,
    thinkingLevel: mode,
    evalResult: {
      shouldSave: evalResult.shouldSave,
      shouldDelete: evalResult.shouldDelete,
      deleteMemoryTitle: evalResult.deleteMemoryTitle,
      reason: evalResult.reason,
      newMemory: newMemoryCreated ? {
        id: newMemoryCreated.id,
        title: newMemoryCreated.title,
        description: newMemoryCreated.description,
        category: newMemoryCreated.category,
        memory: newMemoryCreated.memory,
        importance: newMemoryCreated.importance,
        createdAt: newMemoryCreated.createdAt
      } : undefined
    },
    rerankerTable,
    totalMemoriesStored: memories.length,
    semanticSearchReturned: memories.length,
    passedScoreThreshold: candidatePool.length,
    passedLlmRelevanceCheck: eligibleCandidates.length,
    injectedIntoModelContext: finalSurvivingMemories.length,
    candidatePoolSize: CANDIDATE_POOL_SIZE,
    candidatesPassedToLlm: candidatePool.length,
    relevantMemoriesReturned: eligibleCandidates.length,
    finalContextSelection: finalContextSelection,
    memoryRequired,
    decisionReason
  };

  return {
    replyText,
    trace,
    newMemoryCreated,
    deletedMemoryId
  };
}

/**
 * Parses raw streamed model text to extract tags like <thought>, <think>, or <|channel>thought.
 */
export function parseTextForThoughts(rawText: string): { text: string; thought: string } {
  let text = rawText;
  let thought = "";

  // 1. Check for <thought>...</thought> tags
  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/gi;
  if (thoughtRegex.test(text)) {
    text = text.replace(thoughtRegex, (_, p1) => {
      thought += (thought ? "\n" : "") + p1;
      return "";
    });
  } else {
    // If the tag is opened but not closed yet (streaming)
    const openThoughtRegex = /<thought>([\s\S]*)$/i;
    const match = text.match(openThoughtRegex);
    if (match) {
      thought = match[1];
      text = text.replace(openThoughtRegex, "");
    }
  }

  // 2. Check for <|channel>thought ... <channel|> tags
  const channelRegex = /<\|channel>thought([\s\S]*?)<channel\|>/gi;
  if (channelRegex.test(text)) {
    text = text.replace(channelRegex, (_, p1) => {
      thought += (thought ? "\n" : "") + p1;
      return "";
    });
  } else {
    // If opened but not closed yet
    const openChannelRegex = /<\|channel>thought([\s\S]*)$/i;
    const match = text.match(openChannelRegex);
    if (match) {
      thought = thought || match[1];
      text = text.replace(openChannelRegex, "");
    }
  }

  // 3. Check for standard <think>...</think> tags (like DeepSeek)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  if (thinkRegex.test(text)) {
    text = text.replace(thinkRegex, (_, p1) => {
      thought += (thought ? "\n" : "") + p1;
      return "";
    });
  } else {
    const openThinkRegex = /<think>([\s\S]*)$/i;
    const match = text.match(openThinkRegex);
    if (match) {
      thought = thought || match[1];
      text = text.replace(openThinkRegex, "");
    }
  }

  return {
    text: text,
    thought: thought
  };
}

/**
 * Execute the 10-step memory-retrieval and LLM pipeline sequentially with streaming response
 */
export async function runQueryPipelineStream(
  userQuery: string,
  memories: MemoryRecord[],
  mode: 'fast' | 'thinking' | 'deep' = 'thinking',
  onChunk: (data: { text: string; thought: string }) => void,
  chatHistory: { sender: 'user' | 'ai'; text: string }[] = []
): Promise<PipelineResult> {
  const ai = getAIClient();

  // STEP 1 — Reasoning Decision (Gemma 4 31B naturally decides if long-term memory is required)
  let memoryRequired = false;
  let decisionReason = "";

  try {
    const decisionResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: `User Message:
"${userQuery}"

Task:

Determine whether retrieving long-term memory would meaningfully improve the quality of the response.

Long-term memory may contain information such as:

- User preferences
- Preferred explanation style
- Preferred mathematical depth
- Citation preferences
- Formatting preferences
- Writing preferences
- Ongoing research projects
- Previously stored research notes
- Previous conversations
- Any other durable information intentionally saved for future use

Your objective is NOT to determine whether the user is asking a follow-up question.

Instead, determine whether retrieving stored memories would produce a noticeably better, more personalized, more consistent, or more context-aware response.

Memory SHOULD be retrieved whenever it is likely to improve:

- Explanation style
- Mathematical detail
- Formatting
- Citation style
- Personalization
- Research continuity
- Ongoing projects
- Previously discussed work
- Any response that benefits from remembering the user

Examples where memory is usually REQUIRED:

- Explaining physics concepts
  (Saved explanation preferences may improve the answer.)

- Solving mathematical or physics problems
  (Saved derivation or formatting preferences may improve the response.)

- Summarizing research papers
  (Saved summary style or citation preferences may improve the output.)

- Literature reviews

- Research discussions

- Questions about ongoing projects

- Follow-up requests

- "Continue", "Keep going", or similar requests

- Requests referencing previous conversations

- Requests involving saved preferences

- Requests where long-term context would noticeably improve the final response.

Memory is usually NOT required when:

- Greetings
  (e.g. "Hi", "Hello", "Good morning")

- Casual conversation
  (e.g. "How are you?", "What's your name?")

- Very simple arithmetic
  (e.g. "2 + 2", "15% of 80")

- Extremely short factual questions where personalization would not change the answer.

- Requests that are completely self-contained AND would produce essentially the same response regardless of any stored memories.

Decision Rules:

1. Do NOT retrieve memory simply because memories exist.

2. Do NOT retrieve memory for every request.

3. Retrieve memory whenever it would improve personalization, continuity, explanation quality, or research assistance.

4. If retrieved memories would noticeably improve the response, return memoryRequired = true.

5. If the response would be essentially identical without memory, return memoryRequired = false.

6. When uncertain, ask yourself:
   "Would retrieving long-term memory make this response better for this specific user?"

   If YES → memoryRequired = true

   If NO → memoryRequired = false

Respond ONLY as a JSON object:

{
  "memoryRequired": boolean,
  "reason": "A concise 1–2 sentence explanation describing why memory retrieval would or would not improve the response."
}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            memoryRequired: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["memoryRequired", "reason"]
        }
      }
    }));

    if (decisionResponse.text) {
      const parsed = JSON.parse(decisionResponse.text.trim());
      memoryRequired = !!parsed.memoryRequired;
      decisionReason = parsed.reason || "Evaluated request context.";
    }
  } catch (error) {
    console.error("Error making memory requirement reasoning decision:", error);
    memoryRequired = true;
    decisionReason = "Fallback due to decision error.";
  }

  // Retrieval pipeline variables
  let queryVector: number[] = [];
  let scoredList: any[] = [];
  let candidatePool: any[] = [];
  let eligibleCandidates: any[] = [];
  let finalSurvivingMemories: MemoryRecord[] = [];
  let rerankerTable: any[] = [];
  let finalContextSelection: any[] = [];
  let builtSystemInstruction = "";

  if (memoryRequired) {
    queryVector = await embedText(userQuery, "RETRIEVAL_QUERY");
    const rankResult = rankMemories(userQuery, queryVector, memories);
    scoredList = rankResult.scoredList;
    candidatePool = rankResult.candidatePool;

    const rerankerPromises = candidatePool.map(async (item) => {
      const mem = item.memory;
      const finalRankScore = item.finalRankScore;
      try {
        const prompt = `User Query:
"${userQuery}"

Candidate Memory:
Title:
${mem.title}

Category:
${mem.category}

Description:
${mem.description}

Memory:
${mem.memory}

Task:

Determine whether this memory should be included in Jessie's active context for answering the current user request.

Only evaluate THIS single memory.

A memory is considered relevant only if including it would genuinely improve the quality, accuracy, personalization, continuity, formatting, reasoning, or completeness of the current response.

Think carefully before approving a memory. A false positive is worse than a false negative because unnecessary memories increase context size, cost, and may influence the final answer in unwanted ways.

Respond ONLY as valid JSON.

Schema:
{
  "relevant": boolean,
  "confidence": number,
  "reason": string
}

Evaluation Rules:

1. User Preferences
- Always mark as relevant if the preference changes how Jessie should answer.
- Examples:
  - explanation style
  - citation format
  - response formatting
  - mathematical detail
  - language preference
  - teaching style

2. Ongoing Projects
- Only relevant if the current request directly relates to that project.
- Similar scientific fields alone are NOT enough.
- Example:
  User project: Graphene superconductivity
  User asks: "Find recent graphene superconductivity papers."
  → Relevant

  User asks: "Explain Quantum Hall Effect."
  → NOT relevant

3. Research Notes
- Only include if they provide useful context that materially improves the current answer.
- Do NOT include unrelated notes simply because they belong to physics.

4. Conversation Continuity
- If the user references previous work using phrases such as:
  - continue
  - previous
  - earlier
  - remember
  - same project
  - that paper
  - our discussion
then related memories are relevant.

5. Personal Facts
- Include only if they affect the current request.

6. Broad Domain Matching
- NEVER approve a memory simply because it belongs to physics, science, engineering, mathematics, or another subject area.

7. Similar Vocabulary
- Shared words alone do NOT make a memory relevant.
- The underlying intent of the user's request must match the purpose of the memory.

8. Cost Awareness
- Prefer the minimum number of memories required.
- If this memory provides no measurable benefit, reject it.

9. Independent Evaluation
- Ignore all other memories.
- Judge only this candidate against the current user query.

Return ONLY the JSON object. Do not include markdown, explanations, or additional text.`;

        const res = await callWithRetry(() => ai.models.generateContent({
          model: "gemma-4-31b-it",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                relevant: { type: "boolean" },
                confidence: { type: "number" },
                reason: { type: "string" }
              },
              required: ["relevant", "confidence", "reason"]
            }
          }
        }));

        if (res.text) {
          const parsed = JSON.parse(res.text.trim());
          return {
            memory: mem,
            finalRankScore,
            relevant: !!parsed.relevant,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 1.0,
            reason: parsed.reason || "Processed successfully."
          };
        }
      } catch (error) {
        console.error(`Error reranking memory "${mem.title}":`, error);
      }
      return {
        memory: mem,
        finalRankScore,
        relevant: false,
        confidence: 0,
        reason: "LLM Reranker encountered an evaluation error or returned invalid output."
      };
    });

    const rerankerResults = await Promise.all(rerankerPromises);
    eligibleCandidates = rerankerResults.filter(r => r.relevant && r.finalRankScore >= RELEVANCE_THRESHOLD);
    const sortedEligible = [...eligibleCandidates].sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.finalRankScore - a.finalRankScore;
    });

    const finalSurvivingCandidates = sortedEligible.slice(0, MAX_CONTEXT_MEMORIES);
    finalSurvivingMemories = finalSurvivingCandidates.map(c => c.memory);

    rerankerTable = rerankerResults.map(res => {
      const isFinallyInjected = finalSurvivingMemories.some(m => m.id === res.memory.id);
      return {
        title: res.memory.title,
        relevant: res.relevant,
        confidence: res.confidence,
        reason: res.reason,
        status: (isFinallyInjected ? 'Included' : 'Removed') as 'Included' | 'Removed'
      };
    });

    finalContextSelection = finalSurvivingCandidates.map((c, idx) => ({
      rank: idx + 1,
      title: c.memory.title,
      confidence: c.confidence,
      finalScore: c.finalRankScore
    }));

    builtSystemInstruction = formatSystemInstruction(finalSurvivingMemories);
  }

  // Step 8: Call the main reasoning model with web search grounding (STREAMING)
  const mainModel = "gemma-4-31b-it";
  let replyText = "";
  let accumulatedThought = "";
  let searchUsed = false;
  let searchQueries: string[] = [];
  let searchSources: any[] = [];

  // Throttle callback to at most once per 100ms to eliminate UI scroll lag during streaming
  let lastCallbackTime = 0;
  let pendingChunk: { text: string; thought: string } | null = null;
  let throttleTimeout: any = null;

  const throttledOnChunk = (text: string, thought: string, force = false) => {
    pendingChunk = { text, thought };
    const now = Date.now();

    if (force || now - lastCallbackTime >= 100) {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
        throttleTimeout = null;
      }
      onChunk({ text, thought });
      lastCallbackTime = now;
      pendingChunk = null;
    } else if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        if (pendingChunk) {
          onChunk(pendingChunk);
          lastCallbackTime = Date.now();
          pendingChunk = null;
        }
        throttleTimeout = null;
      }, 100 - (now - lastCallbackTime));
    }
  };

  // Build full content array including history for conversational context
  const apiContents: any[] = [];
  for (const turn of chatHistory) {
    if (turn.text && turn.text.trim()) {
      apiContents.push({
        role: turn.sender === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }]
      });
    }
  }
  apiContents.push({
    role: 'user',
    parts: [{ text: userQuery }]
  });

  try {
    const responseStream = await callWithRetry(() => ai.models.generateContentStream({
      model: mainModel,
      contents: apiContents,
      config: {
        // Structured Content object with explicit role:'system' — required by Gemma API to prevent 500 errors
        systemInstruction: builtSystemInstruction
          ? { role: 'system', parts: [{ text: builtSystemInstruction }] }
          : undefined,
        tools: [{ googleSearch: {} }],
        thinkingConfig: {
          thinkingLevel: mode === 'fast' ? ThinkingLevel.MINIMAL : ThinkingLevel.HIGH
        }
      }
    }));

    for await (const chunk of responseStream) {
      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata) {
        searchUsed = searchUsed || !!(groundingMetadata.webSearchQueries && groundingMetadata.webSearchQueries.length > 0);
        if (groundingMetadata.webSearchQueries) {
          searchQueries = Array.from(new Set([...searchQueries, ...groundingMetadata.webSearchQueries]));
        }
        if (groundingMetadata.groundingChunks) {
          const chunksMapped = groundingMetadata.groundingChunks.map(c => ({
            title: c.web?.title || c.web?.uri || "Web Source",
            uri: c.web?.uri || ""
          })).filter(src => src.uri !== "");
          searchSources = [...searchSources, ...chunksMapped];
        }
      }

      const candidates = chunk.candidates;
      if (candidates?.[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.thought) {
            accumulatedThought += part.text || "";
          } else if (part.text) {
            replyText += part.text || "";
          }
        }
      }

      // Parse tags inside replyText if we don't have native thoughts
      let parsedText = replyText;
      let parsedThought = accumulatedThought;
      if (!accumulatedThought && replyText) {
        const parsed = parseTextForThoughts(replyText);
        parsedText = parsed.text;
        parsedThought = parsed.thought;
      }

      throttledOnChunk(parsedText, parsedThought);
    }
  } catch (err) {
    if (throttleTimeout) {
      clearTimeout(throttleTimeout);
    }
    console.error("Error during streaming generation:", err);
    throw err;
  }

  if (throttleTimeout) {
    clearTimeout(throttleTimeout);
  }

  // Deduplicate search sources
  const seenUris = new Set<string>();
  searchSources = searchSources.filter(src => {
    if (seenUris.has(src.uri)) return false;
    seenUris.add(src.uri);
    return true;
  });

  // Ensure searchUsed is computed dynamically
  searchUsed = searchUsed || searchQueries.length > 0 || searchSources.length > 0;

  // Re-run regex parser at the end to clean tags completely
  let finalReplyText = replyText;
  let finalThought = accumulatedThought;
  if (!accumulatedThought && replyText) {
    const parsed = parseTextForThoughts(replyText);
    finalReplyText = parsed.text;
    finalThought = parsed.thought;
  }

  // Force invoke the final exact state
  onChunk({ text: finalReplyText, thought: finalThought });

  // Step 9: Memory Evaluation (Using ThinkingLevel.MINIMAL to keep latency low)
  let evalResult = {
    shouldSave: false,
    shouldDelete: false,
    deleteMemoryTitle: "",
    reason: "No evaluation processed."
  };
  let newMemoryCreated: any = undefined;
  let deletedMemoryId: string | undefined = undefined;

  try {
    const memorySummaryText = memories.map(m => `- ID: "${m.id}", Title: "${m.title}", Memory content: "${m.memory}"`).join("\n");
    const evalResponse = await ai.models.generateContent({
      model: mainModel,
      contents: `User said:
"${userQuery}"

Assistant replied:
"${finalReplyText}"

All existing memories currently stored in the memory bank:
${memorySummaryText || "None"}

You are Jessie's Long-Term Memory Manager.

Your responsibility is to decide whether this conversation should modify Jessie's long-term memory.

Long-term memory should contain only durable information that is likely to improve future conversations.

Tasks:

1. Determine whether a NEW memory should be created.
2. Determine whether an EXISTING memory should be deleted.
3. If neither action is required, leave both as false.
4. Explain your decision briefly in the "reason" field.

A memory SHOULD be saved only if the user provides durable information such as:

• Long-term preferences
  Examples:
  - "Always explain equations step-by-step."
  - "Use APS citations."
  - "Answer in simple English."
  - "From now on..."

• Ongoing research projects
  Examples:
  - "I'm working on graphene superconductivity."
  - "My thesis is about plasma physics."

• Long-term personal working context
  Examples:
  - Preferred formatting
  - Writing style
  - Citation style
  - Teaching preference
  - Permanent workflow instructions

A memory should NOT be saved for:

• Greetings
• One-time questions
• Temporary requests
• Single explanations
• Short conversations
• Information already contained in existing memories
• Facts that are only relevant to the current conversation
• Assistant-generated content
• Web search results
• Temporary research findings

Before saving a memory:

- Compare it against the existing memory list.
- If an equivalent memory already exists, do NOT create a duplicate.
- If the new information updates an existing memory, prefer replacing or deleting the old version instead of creating multiple conflicting memories.

Deletion Rules:

Delete a memory ONLY if the user explicitly requests it.

Examples:
- "Forget my citation preference."
- "Delete my graphene project."
- "Remove my explanation preference."

Never delete memories automatically.
Never infer deletion from context.

If deletion is requested, set deleteMemoryTitle to the EXACT memory title or ID from the memory list above.

If shouldSave is true, generate:

- title
- description
- category
- memory
- importance (0-10)

Guidelines for generated memory fields:

title:
A short unique title.

description:
One concise sentence describing the memory.

category:
Examples:
- User Preference
- Research Project
- Research Notes
- Writing Preference
- Citation Preference
- Other

memory:
Store only the durable information itself.
Do not include unnecessary wording.

importance:
0–3 = Low future value
4–6 = Useful
7–8 = Important
9–10 = Critical long-term preference or project

Respond ONLY as valid JSON matching the required schema.
Do not include markdown or any additional explanation.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            shouldSave: { type: "boolean" },
            shouldDelete: { type: "boolean" },
            deleteMemoryTitle: { type: "string" },
            reason: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            memory: { type: "string" },
            importance: { type: "number" }
          },
          required: ["shouldSave", "shouldDelete", "reason"]
        }
      }
    });

    if (evalResponse.text) {
      const parsed = JSON.parse(evalResponse.text.trim());
      evalResult = {
        shouldSave: !!parsed.shouldSave,
        shouldDelete: !!parsed.shouldDelete,
        deleteMemoryTitle: parsed.deleteMemoryTitle || "",
        reason: parsed.reason || ""
      };

      if (evalResult.shouldDelete && evalResult.deleteMemoryTitle) {
        const queryClean = evalResult.deleteMemoryTitle.trim().toLowerCase();
        const matched = memories.find(m =>
          m.id.toLowerCase() === queryClean ||
          m.title.toLowerCase() === queryClean ||
          m.title.toLowerCase().includes(queryClean) ||
          queryClean.includes(m.title.toLowerCase())
        );
        if (matched) {
          deletedMemoryId = matched.id;
        }
      }

      if (evalResult.shouldSave && parsed.memory) {
        const memoryVector = await embedText(parsed.memory, "RETRIEVAL_DOCUMENT");
        const randomIdSuffix = typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).substring(2, 10);

        newMemoryCreated = {
          id: "mem_" + randomIdSuffix,
          title: parsed.title || "User Preference Note",
          description: parsed.description || "Inferred from conversation.",
          category: parsed.category || "General",
          memory: parsed.memory,
          importance: typeof parsed.importance === 'number' ? Math.max(0, Math.min(10, parsed.importance)) : 5,
          createdAt: Date.now(),
          embedding: memoryVector
        };
      }
    }
  } catch (err) {
    console.error("Memory evaluation step encountered an error:", err);
    evalResult.reason = "Evaluation step error: " + (err instanceof Error ? err.message : String(err));
  }

  const trace: TraceRecord = {
    queryText: userQuery,
    queryEmbeddingLength: queryVector.length,
    retrievalTable: scoredList,
    systemInstructionSent: builtSystemInstruction,
    searchUsed,
    searchQueries,
    searchSources,
    thinkingLevel: mode,
    evalResult: {
      shouldSave: evalResult.shouldSave,
      shouldDelete: evalResult.shouldDelete,
      deleteMemoryTitle: evalResult.deleteMemoryTitle,
      reason: evalResult.reason,
      newMemory: newMemoryCreated ? {
        id: newMemoryCreated.id,
        title: newMemoryCreated.title,
        description: newMemoryCreated.description,
        category: newMemoryCreated.category,
        memory: newMemoryCreated.memory,
        importance: newMemoryCreated.importance,
        createdAt: newMemoryCreated.createdAt
      } : undefined
    },
    rerankerTable,
    totalMemoriesStored: memories.length,
    semanticSearchReturned: memories.length,
    passedScoreThreshold: candidatePool.length,
    passedLlmRelevanceCheck: eligibleCandidates.length,
    injectedIntoModelContext: finalSurvivingMemories.length,
    candidatePoolSize: CANDIDATE_POOL_SIZE,
    candidatesPassedToLlm: candidatePool.length,
    relevantMemoriesReturned: eligibleCandidates.length,
    finalContextSelection: finalContextSelection,
    memoryRequired,
    decisionReason
  };

  return {
    replyText: finalReplyText,
    trace,
    newMemoryCreated,
    deletedMemoryId
  };
}
