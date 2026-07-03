import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  GEMINI_API_KEY,
  CANDIDATE_POOL_SIZE,
  MAX_CONTEXT_MEMORIES,
  RELEVANCE_THRESHOLD,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
  DEFAULT_CUSTOM_INSTRUCTIONS
} from "./config";
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
async function callWithRetry<T>(fn: () => Promise<T>, retries = 4, delay = 1500, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) {
    throw new DOMException("The user aborted a request.", "AbortError");
  }
  try {
    return await fn();
  } catch (error: any) {
    if (signal?.aborted || error.name === 'AbortError') {
      throw new DOMException("The user aborted a request.", "AbortError");
    }
    const errorStr = String(error);
    const isRetryable = errorStr.includes("500") || errorStr.includes("503") || errorStr.includes("demand") || errorStr.includes("INTERNAL") || errorStr.includes("UNAVAILABLE") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("429");
    if (retries > 0 && isRetryable) {
      console.warn(`Temporary API error encountered. Retrying in ${delay}ms... (${retries} retries left). Error:`, error);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (signal) {
            signal.removeEventListener("abort", onAbort);
          }
          resolve();
        }, delay);
        
        function onAbort() {
          clearTimeout(timeout);
          reject(new DOMException("The user aborted a request.", "AbortError"));
        }
        
        if (signal) {
          signal.addEventListener("abort", onAbort);
        }
      });
      return callWithRetry(fn, retries - 1, delay * 2, signal);
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
 * Line-to-line match with the memory-management repository implementation, modified for strict sequential execution.
 */
export async function runQueryPipeline(
  userQuery: string,
  memories: MemoryRecord[],
  thinkingToggleIsHigh: boolean
): Promise<PipelineResult> {
  const ai = getAIClient();

  // STEP 1 — Reasoning Decision (Gemma 4 31B naturally decides if long-term memory is required)
  let memoryRequired = false;
  let decisionReason = "";

  try {
    const decisionResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemma-4-26b-a4b-it",
      contents: `User Message:
"${userQuery}"

Task: Decide whether additional long-term memory/context from past conversations, preference profiles, or research notes is actually needed to answer this request correctly.

Examples where memory is usually NOT required:
- Greetings (e.g. "hi", "hello", "good morning")
- Casual conversation (e.g. "how are you?", "what is your name?")
- Standalone physics questions (e.g. "Explain string theory", "What is quantum entanglement?")
- General knowledge (e.g. "Who wrote Hamlet?", "What is the capital of France?")
- Simple calculations (e.g. "2+2", "15% of 80")
- One-time requests that do not depend on past info

Examples where memory IS likely required:
- Follow-up questions or requests referencing past events/conversations (e.g. "What did we talk about earlier?", "Do you remember my paper?")
- User preferences (e.g. "How did I want my citations formatted?", "Summarize this according to my preferences")
- Ongoing research projects
- Citation preferences
- "Continue..." or "Keep going" type requests
- Anything depending on previously stored information

Respond ONLY as a JSON object:
{
  "memoryRequired": boolean,
  "reason": "A short, concise explanation (1-2 sentences) of why memory/context is or is not required."
}
DO NOT include any <think> or <thought> tags. Output raw JSON only.`,
      config: {
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

    // LLM Relevance Reranker (evaluated strictly sequential to prevent parallel 500 crashes)
    const rerankerResults = [];
    for (const item of candidatePool) {
      const mem = item.memory;
      const finalRankScore = item.finalRankScore;
      try {
        const prompt = `User Query:
"${userQuery}"

Candidate Memory:
Title:
${mem.title}

Memory:
${mem.memory}

Determine whether this memory would genuinely help answer the user's request.
Respond ONLY as JSON. DO NOT include any <think> or <thought> tags.

Schema:
{
  "relevant": boolean,
  "confidence": number,
  "reason": string
}

Rules:
A memory is relevant only if it would improve the current answer.
Being in the same broad scientific field is NOT sufficient.
Do NOT approve memories merely because they mention physics.
Project memories should only be included if they directly relate to the user's request.
Research notes should only be included if they materially improve the answer.
User preferences are always considered relevant whenever they affect response formatting or explanation style.`;

        const res = await callWithRetry(() => ai.models.generateContent({
          model: "gemma-4-26b-a4b-it",
          contents: prompt,
          config: {
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
        }), 6, 2000);

        if (res.text) {
          const parsed = JSON.parse(res.text.trim());
          rerankerResults.push({
            memory: mem,
            finalRankScore,
            relevant: !!parsed.relevant,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 1.0,
            reason: parsed.reason || "Processed successfully."
          });
          continue;
        }
      } catch (error) {
        console.error(`Error reranking memory "${mem.title}":`, error);
      }
      rerankerResults.push({
        memory: mem,
        finalRankScore: false,
        relevant: false,
        confidence: 0,
        reason: "LLM Reranker encountered an evaluation error or returned invalid output."
      });
    }

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
  } else {
    builtSystemInstruction = "";
  }

  // Call the main reasoning model
  const mainModel = "gemma-4-26b-a4b-it";
  const mainResponse = await callWithRetry(() => ai.models.generateContent({
    model: mainModel,
    contents: userQuery,
    config: {
      ...(builtSystemInstruction ? { systemInstruction: { role: 'system', parts: [{ text: builtSystemInstruction }] } } : {}),
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
      }
    }
  }));

  const replyText = mainResponse.text || "No response text generated by the model.";
  const groundingMetadata = mainResponse.candidates?.[0]?.groundingMetadata;
  const searchQueries = groundingMetadata?.webSearchQueries || [];
  const searchSources = groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title || chunk.web?.uri || "Web Source",
    uri: chunk.web?.uri || ""
  })).filter(src => src.uri !== "") || [];
  const searchUsed = !!(searchQueries.length > 0 || searchSources.length > 0);

  // Memory Evaluation (strictly formatted for Gemma JSON compliance)
  let evalResult = {
    shouldSave: false,
    shouldDelete: false,
    deleteMemoryTitle: "",
    reason: "No evaluation processed.",
    title: "",
    description: "",
    category: "",
    memory: "",
    importance: 5
  };
  let newMemoryCreated: MemoryRecord | undefined = undefined;
  let deletedMemoryId: string | undefined = undefined;

  try {
    const memorySummaryText = memories.map(m => `- ID: "${m.id}", Title: "${m.title}", Memory content: "${m.memory}"`).join("\n");
    const cleanedReplyText = replyText.length > 1000 ? replyText.slice(0, 1000) + "... [truncated]" : replyText;
    const evalResponse = await callWithRetry(() => ai.models.generateContent({
      model: mainModel,
      contents: `User said: "${userQuery}"\nAssistant replied: "${cleanedReplyText}"\n\nAll existing memories currently stored in the memory bank:\n${memorySummaryText || "None"}\n\nTask:\n1. Did the user state a new durable, reusable preference, fact, or project detail that should be saved? Set shouldSave to true.\n2. Did the user explicitly ask to delete, forget, or remove a previously saved memory/fact? Set shouldDelete to true, and set deleteMemoryTitle to the EXACT title or ID of that memory from the database list above.\n3. Provide the reason for your evaluation in the "reason" field.\n\nImportant Rules:\n- Return a valid JSON object matching the schema exactly.\n- DO NOT output any <think> or <thought> tags.\n- For any string fields that are not applicable (e.g., deleteMemoryTitle, title, description, category, memory), you MUST provide an empty string "".\n- For the importance field, provide 0 if not applicable.`,
      config: {
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
          required: [
            "shouldSave",
            "shouldDelete",
            "deleteMemoryTitle",
            "reason",
            "title",
            "description",
            "category",
            "memory",
            "importance"
          ]
        }
      }
    }));

    if (evalResponse.text) {
      const parsed = JSON.parse(evalResponse.text.trim());
      evalResult = { ...evalResult, ...parsed };

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

      if (evalResult.shouldSave && evalResult.memory) {
        const memoryVector = await embedText(evalResult.memory, "RETRIEVAL_DOCUMENT");
        const randomIdSuffix = typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).substring(2, 10);

        newMemoryCreated = {
          id: "mem_" + randomIdSuffix,
          title: evalResult.title || "User Preference Note",
          description: evalResult.description || "Inferred from conversation.",
          category: evalResult.category || "General",
          memory: evalResult.memory,
          importance: typeof evalResult.importance === 'number' ? Math.max(0, Math.min(10, evalResult.importance)) : 5,
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
    thinkingLevel: thinkingToggleIsHigh ? 'High' : 'Minimal',
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
 * Execute the 10-step memory-retrieval and LLM pipeline sequentially with streaming response.
 * Uses exact prompts, models, and steps from the memory-management workflow, with sequential execution to prevent 500s.
 */
export async function runQueryPipelineStream(
  userQuery: string,
  memories: MemoryRecord[],
  onChunk: (data: { text: string; thought: string }) => void,
  chatHistory: { sender: 'user' | 'ai'; text: string }[] = [],
  images?: { mimeType: string; base64Data: string }[],
  pdfs?: { mimeType: string; base64Data: string }[],
  signal?: AbortSignal
): Promise<PipelineResult> {
  const ai = getAIClient();

  // STEP 1 — Reasoning Decision (Gemma 4 31B naturally decides if long-term memory is required)
  let memoryRequired = false;
  let decisionReason = "";

  if (signal?.aborted) {
    throw new DOMException("The user aborted a request.", "AbortError");
  }
  try {
    const decisionResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemma-4-26b-a4b-it",
      contents: `User Message:
"${userQuery}"

Task: Decide whether additional long-term memory/context from past conversations, preference profiles, or research notes is actually needed to answer this request correctly.

Examples where memory is usually NOT required:
- Greetings (e.g. "hi", "hello", "good morning")
- Casual conversation (e.g. "how are you?", "what is your name?")
- Standalone physics questions (e.g. "Explain string theory", "What is quantum entanglement?")
- General knowledge (e.g. "Who wrote Hamlet?", "What is the capital of France?")
- Simple calculations (e.g. "2+2", "15% of 80")
- One-time requests that do not depend on past info

Examples where memory IS likely required:
- Follow-up questions or requests referencing past events/conversations (e.g. "What did we talk about earlier?", "Do you remember my paper?")
- User preferences (e.g. "How did I want my citations formatted?", "Summarize this according to my preferences")
- Ongoing research projects
- Citation preferences
- "Continue..." or "Keep going" type requests
- Anything depending on previously stored information

Respond ONLY as a JSON object:
{
  "memoryRequired": boolean,
  "reason": "A short, concise explanation (1-2 sentences) of why memory/context is or is not required."
}
DO NOT include any <think> or <thought> tags. Output raw JSON only.`,
      config: {
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
    }, { signal }), 4, 1500, signal);

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

    // LLM Relevance Reranker (evaluated sequentially one by one to prevent parallel API 500 errors)
    const rerankerResults = [];
    for (const item of candidatePool) {
      const mem = item.memory;
      const finalRankScore = item.finalRankScore;
      try {
        if (signal?.aborted) {
          throw new DOMException("The user aborted a request.", "AbortError");
        }
        const prompt = `User Query:
"${userQuery}"

Candidate Memory:
Title:
${mem.title}

Memory:
${mem.memory}

Determine whether this memory would genuinely help answer the user's request.
Respond ONLY as JSON. DO NOT include any <think> or <thought> tags.

Schema:
{
  "relevant": boolean,
  "confidence": number,
  "reason": string
}

Rules:
A memory is relevant only if it would improve the current answer.
Being in the same broad scientific field is NOT sufficient.
Do NOT approve memories merely because they mention physics.
Project memories should only be included if they directly relate to the user's request.
Research notes should only be included if they materially improve the answer.
User preferences are always considered relevant whenever they affect response formatting or explanation style.`;

        const res = await callWithRetry(() => ai.models.generateContent({
          model: "gemma-4-26b-a4b-it",
          contents: prompt,
          config: {
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
        }, { signal }), 6, 2000, signal);

        if (res.text) {
          const parsed = JSON.parse(res.text.trim());
          rerankerResults.push({
            memory: mem,
            finalRankScore,
            relevant: !!parsed.relevant,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 1.0,
            reason: parsed.reason || "Processed successfully."
          });
          continue;
        }
      } catch (error) {
        console.error(`Error reranking memory "${mem.title}":`, error);
      }

      rerankerResults.push({
        memory: mem,
        finalRankScore: false,
        relevant: false,
        confidence: 0,
        reason: "LLM Reranker encountered an evaluation error or returned invalid output."
      });
    }

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
  } else {
    builtSystemInstruction = "";
  }

  // Load dynamic model parameters from localStorage with fallback to file configs
  const storedTemp = typeof window !== 'undefined' ? localStorage.getItem('physica_ai_temperature') : null;
  const storedTopP = typeof window !== 'undefined' ? localStorage.getItem('physica_ai_top_p') : null;
  const storedInstructions = typeof window !== 'undefined' ? localStorage.getItem('physica_ai_custom_instructions') : null;

  const temperature = storedTemp !== null ? parseFloat(storedTemp) : DEFAULT_TEMPERATURE;
  const topP = storedTopP !== null ? parseFloat(storedTopP) : DEFAULT_TOP_P;
  const customInstructions = storedInstructions !== null ? storedInstructions : DEFAULT_CUSTOM_INSTRUCTIONS;

  // Format conversation history for single-turn robustness to prevent tool use 500 errors
  let historyContext = "";
  if (chatHistory && chatHistory.length > 0) {
    historyContext = "Recent Conversation History:\n" + chatHistory.map(turn => {
      const senderName = turn.sender === 'user' ? 'User' : 'Assistant';
      return `${senderName}: ${turn.text}`;
    }).join("\n") + "\n\n";
  }

  // Append user custom instructions to the final builtSystemInstruction
  let finalSystemInstruction = builtSystemInstruction;
  if (customInstructions && customInstructions.trim()) {
    finalSystemInstruction = finalSystemInstruction
      ? `${finalSystemInstruction}\n\nAdditional Instructions:\n${customInstructions}`
      : customInstructions;
  }

  if (historyContext) {
    finalSystemInstruction = finalSystemInstruction
      ? `${historyContext}${finalSystemInstruction}`
      : historyContext;
  }

  // Call the main reasoning model with web search grounding (STREAMING)
  const mainModel = "gemma-4-26b-a4b-it";
  let searchUsed = false;
  let searchQueries: string[] = [];
  let searchSources: any[] = [];
  let replyText = "";
  let accumulatedThought = "";

  // Single-turn payload to bypass Google API's multi-turn tool validation crashes
  const userParts: any[] = [{ text: userQuery }];
  if (images && images.length > 0) {
    images.forEach(img => {
      userParts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64Data
        }
      });
    });
  }
  // PDFs: gemma-4-26b-a4b-it does NOT support application/pdf via inlineData (causes 500 error).
  // Must use File API upload + fileData URI reference (officially supported method).
  if (pdfs && pdfs.length > 0) {
    for (const pdf of pdfs) {
      try {
        const byteString = atob(pdf.base64Data);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: pdf.mimeType });
        const uploadResult = await ai.files.upload({
          file: blob,
          config: { mimeType: pdf.mimeType }
        });

        if (!uploadResult || !uploadResult.name) {
          throw new Error("PDF upload failed or returned no file name.");
        }

        // VERIFIED FIX: Wait for the PDF to complete server-side processing to prevent 500 errors.
        // Files uploaded to the Gemini API enter a PROCESSING state. Attempting to generate content
        // with a file that is still PROCESSING causes an Internal Server Error (500) on gemma models.
        let fileInfo = await ai.files.get({ name: uploadResult.name });
        while (fileInfo.state === "PROCESSING") {
          await new Promise(resolve => setTimeout(resolve, 2000));
          fileInfo = await ai.files.get({ name: uploadResult.name });
        }

        if (fileInfo.state === "FAILED") {
          console.error(`PDF processing failed on Google backend for file: ${uploadResult.name}`);
          continue;
        }

        const fileUri = fileInfo.uri || uploadResult.uri;
        if (fileUri) {
          userParts.push({
            fileData: {
              fileUri: fileUri,
              mimeType: fileInfo.mimeType || uploadResult.mimeType || pdf.mimeType
            }
          });
        }
      } catch (uploadErr) {
        console.error("PDF File API upload failed:", uploadErr);
      }
    }
  }

  const apiContents = [
    {
      role: 'user',
      parts: userParts
    }
  ];

  // Setup throttling for smooth chunks streaming (Apple aesthetic UX)
  let pendingText = "";
  let pendingThought = "";
  let throttleTimeout: NodeJS.Timeout | null = null;

  const throttledOnChunk = (text: string, thought: string) => {
    pendingText = text;
    pendingThought = thought;

    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        onChunk({ text: pendingText, thought: pendingThought });
        throttleTimeout = null;
      }, 35); // ~30 fps update rate for buttery smooth rendering
    }
  };

  let streamRetries = 3;
  let streamSuccess = false;
  let useSearchTool = true;

  while (streamRetries > 0 && !streamSuccess) {
    try {
      // Reset buffers on retry
      replyText = "";
      accumulatedThought = "";

      if (signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const responseStream = await callWithRetry(() => ai.models.generateContentStream({
        model: mainModel,
        contents: apiContents,
        config: {
          ...(finalSystemInstruction ? { systemInstruction: { role: 'system', parts: [{ text: finalSystemInstruction }] } } : {}),
          ...(useSearchTool ? { tools: [{ googleSearch: {} }] } : {}),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          },
          temperature,
          topP
        }
      }, { signal }), 3, 1500, signal);

      for await (const chunk of responseStream) {
        if (signal?.aborted) {
          throw new DOMException("The user aborted a request.", "AbortError");
        }
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

        let parsedText = replyText;
        let parsedThought = accumulatedThought;
        if (!accumulatedThought && replyText) {
          const parsed = parseTextForThoughts(replyText);
          parsedText = parsed.text;
          parsedThought = parsed.thought;
        }

        throttledOnChunk(parsedText, parsedThought);
      }

      streamSuccess = true;
    } catch (err: any) {
      streamRetries--;
      const errStr = String(err);

      // If it is a 500 error and we were using the search tool, fallback to no-search
      if (useSearchTool && (errStr.includes("500") || errStr.includes("INTERNAL"))) {
        console.warn("Google Search grounding failed on Gemma model with 500 error. Falling back to search-disabled request...");
        useSearchTool = false;
        streamRetries++; // Don't consume a retry attempt for the fallback trigger
        continue;
      }

      const isRetryable = errStr.includes("503") || errStr.includes("500") || errStr.includes("UNAVAILABLE") || errStr.includes("INTERNAL") || errStr.includes("RESOURCE_EXHAUSTED");

      if (streamRetries > 0 && isRetryable) {
        console.warn(`Streaming failed due to service instability. Retrying stream from start in 1500ms... (${streamRetries} attempts left). Error:`, err);
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }

      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      console.error("Error during streaming generation:", err);
      throw err;
    }
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

  searchUsed = searchUsed || searchQueries.length > 0 || searchSources.length > 0;

  let finalReplyText = replyText;
  let finalThought = accumulatedThought;
  if (!accumulatedThought && replyText) {
    const parsed = parseTextForThoughts(replyText);
    finalReplyText = parsed.text;
    finalThought = parsed.thought;
  }

  onChunk({ text: finalReplyText, thought: finalThought });

  // STEP 10: Memory Evaluation (strictly formatted for Gemma JSON compliance)
  let evalResult = {
    shouldSave: false,
    shouldDelete: false,
    deleteMemoryTitle: "",
    reason: "No evaluation processed.",
    title: "",
    description: "",
    category: "",
    memory: "",
    importance: 5
  };
  let newMemoryCreated: MemoryRecord | undefined = undefined;
  let deletedMemoryId: string | undefined = undefined;

  try {
    if (signal?.aborted) {
      throw new DOMException("The user aborted a request.", "AbortError");
    }
    const memorySummaryText = memories.map(m => `- ID: "${m.id}", Title: "${m.title}", Memory content: "${m.memory}"`).join("\n");
    const cleanedReplyText = finalReplyText.length > 1000 ? finalReplyText.slice(0, 1000) + "... [truncated]" : finalReplyText;
    const evalResponse = await callWithRetry(() => ai.models.generateContent({
      model: mainModel,
      contents: `User said: "${userQuery}"\nAssistant replied: "${cleanedReplyText}"\n\nAll existing memories currently stored in the memory bank:\n${memorySummaryText || "None"}\n\nTask:\n1. Did the user state a new durable, reusable preference, fact, or project detail that should be saved? Set shouldSave to true.\n2. Did the user explicitly ask to delete, forget, or remove a previously saved memory/fact? Set shouldDelete to true, and set deleteMemoryTitle to the EXACT title or ID of that memory from the database list above.\n3. Provide the reason for your evaluation in the "reason" field.\n\nImportant Rules:\n- Return a valid JSON object matching the schema exactly.\n- DO NOT output any <think> or <thought> tags.\n- For any string fields that are not applicable (e.g., deleteMemoryTitle, title, description, category, memory), you MUST provide an empty string "".\n- For the importance field, provide 0 if not applicable.`,
      config: {
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
          required: [
            "shouldSave",
            "shouldDelete",
            "deleteMemoryTitle",
            "reason",
            "title",
            "description",
            "category",
            "memory",
            "importance"
          ]
        }
      }
    }, { signal }), 4, 1500, signal);

    if (evalResponse.text) {
      const parsed = JSON.parse(evalResponse.text.trim());
      evalResult = { ...evalResult, ...parsed };

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

      if (evalResult.shouldSave && evalResult.memory) {
        const memoryVector = await embedText(evalResult.memory, "RETRIEVAL_DOCUMENT");
        const randomIdSuffix = typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).substring(2, 10);

        newMemoryCreated = {
          id: "mem_" + randomIdSuffix,
          title: evalResult.title || "User Preference Note",
          description: evalResult.description || "Inferred from conversation.",
          category: evalResult.category || "General",
          memory: evalResult.memory,
          importance: typeof evalResult.importance === 'number' ? Math.max(0, Math.min(10, evalResult.importance)) : 5,
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
    thinkingLevel: 'High',
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
    // If the tag is opened but not closed yet
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