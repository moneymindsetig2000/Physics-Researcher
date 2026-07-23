import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_API_KEY,
  CANDIDATE_POOL_SIZE,
  MAX_CONTEXT_MEMORIES,
  RELEVANCE_THRESHOLD
} from "./config";
import type { MemoryRecord, TraceRecord } from "./types";
import { rankMemories } from "../pipeline/pipeline";
import { DEFAULT_SYSTEM_ROLE } from "../systemroles/systemroles";

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
export async function callWithRetry<T>(fn: () => Promise<T>, retries = 4, delay = 1500, signal?: AbortSignal): Promise<T> {
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

/**
 * Create a raw REST streaming connection to the Google AI API, bypassing the
 * @google/genai SDK.
 */
async function createRawStream(
  model: string,
  contents: any[],
  config: {
    systemInstruction?: any;
    tools?: any[];
    thinkingConfig?: { thinkingLevel: string };
  },
  signal?: AbortSignal
): Promise<AsyncGenerator<any>> {
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`);
  url.searchParams.set('alt', 'sse');

  const body: Record<string, any> = { contents };
  if (config.systemInstruction) body.systemInstruction = config.systemInstruction;
  if (config.tools) body.tools = config.tools;
  if (config.thinkingConfig) {
    body.generationConfig = { thinkingConfig: config.thinkingConfig };
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err: any = new Error(`HTTP ${response.status}: ${errorText}`);
    err.status = response.status;
    throw err;
  }

  return sseGenerator(response);
}

async function* sseGenerator(response: Response): AsyncGenerator<any> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is empty');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const dataPrefix = 'data:';
  const delimiters = ['\n\n', '\r\r', '\r\n\r\n'];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        let delimiterIndex = -1;
        let delimiterLength = 0;
        for (const delimiter of delimiters) {
          const index = buffer.indexOf(delimiter);
          if (index !== -1 && (delimiterIndex === -1 || index < delimiterIndex)) {
            delimiterIndex = index;
            delimiterLength = delimiter.length;
          }
        }
        if (delimiterIndex === -1) break;

        const eventString = buffer.substring(0, delimiterIndex);
        buffer = buffer.substring(delimiterIndex + delimiterLength);
        const trimmedEvent = eventString.trim();

        if (trimmedEvent.startsWith(dataPrefix)) {
          const jsonStr = trimmedEvent.substring(dataPrefix.length).trim();
          if (jsonStr) {
            yield JSON.parse(jsonStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface PipelineResult {
  replyText: string;
  trace: TraceRecord;
  newMemoryCreated?: MemoryRecord;
  deletedMemoryId?: string;
  questionForm?: { question: string; options: string[] };
}

/**
 * Build the contents array from chat history + current user query for Gemma 4 API.
 * Strips thought tags and memory_action XML from previous model turns to prevent 500 errors.
 */
function buildContents(
  chatHistory: { sender: 'user' | 'ai'; text: string }[] | undefined,
  userQuery: string,
  images?: { mimeType: string; base64Data: string }[]
): ({ role: string; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] })[] {
  const contents: ({ role: string; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] })[] = [];
  if (chatHistory) {
    for (const msg of chatHistory) {
      const role = msg.sender === 'ai' ? 'model' : 'user';
      let text = msg.text;
      if (role === 'model') {
        text = text
          .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<\|channel>thought[\s\S]*?<channel\|>/gi, '')
          .replace(/<memory_action>[\s\S]*?<\/memory_action>/gi, '')
          .replace(/<memory_action\s*\/>/gi, '')
          .trim();
      }
      if (text) {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }
  const userParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  if (images) {
    for (const img of images) {
      userParts.push({ inlineData: { mimeType: img.mimeType, data: img.base64Data } });
    }
  }
  userParts.push({ text: userQuery });
  contents.push({ role: 'user', parts: userParts });
  return contents;
}

/**
 * Simplified streaming pipeline:
 *   Step 1: Embed the user's query directly → search memories → filter top K.
 *   Step 2: Stream the main model (gemma-4-26b-a4b-it) with memory context + google search + thinking.
 *           Model generates answer and ends with <memory_action> XML for save/delete.
 * Chat history is properly formatted (thoughts stripped) to prevent 500s on subsequent messages.
 */
export async function runQueryPipelineStream(
  userQuery: string,
  memories: MemoryRecord[],
  onChunk: (data: { text: string; thought: string; questionForm?: { question: string; options: string[] } }) => void,
  chatHistory?: { sender: 'user' | 'ai'; text: string }[],
  images?: { mimeType: string; base64Data: string }[],
  pdfs?: { mimeType: string; base64Data: string }[],
  signal?: AbortSignal
): Promise<PipelineResult> {
  const ai = getAIClient();

  if (signal?.aborted) {
    throw new DOMException("The user aborted a request.", "AbortError");
  }

  const contents = buildContents(chatHistory, userQuery, images);

  // Handle PDFs via File API (inlineData causes 500 errors on gemma-4-26b-a4b-it)
  if (pdfs && pdfs.length > 0 && contents.length > 0) {
    const lastContent = contents[contents.length - 1];
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
          (lastContent.parts as any[]).push({
            fileData: {
              fileUri,
              mimeType: fileInfo.mimeType || uploadResult.mimeType || pdf.mimeType
            }
          });
        }
      } catch (uploadErr) {
        console.error("PDF File API upload failed:", uploadErr);
      }
    }
  }

  // Step 1: Directly embed the user's query, search memories, filter top K
  let queryVector: number[] = [];
  let scoredList: any[] = [];
  let candidatePool: any[] = [];
  let finalSurvivingMemories: MemoryRecord[] = [];
  let memoryContextStr = "";
  let memoryFound = false;

  if (memories.length > 0) {
    try {
      queryVector = await embedText(userQuery, "RETRIEVAL_QUERY");
      const rankResult = rankMemories(userQuery, queryVector, memories);
      scoredList = rankResult.scoredList;
      candidatePool = rankResult.candidatePool;
      const filtered = rankResult.candidatePool
        .filter((c: any) => c.finalRankScore >= RELEVANCE_THRESHOLD)
        .slice(0, MAX_CONTEXT_MEMORIES);
      finalSurvivingMemories = filtered.map((c: any) => c.memory);
      if (finalSurvivingMemories.length > 0) {
        memoryContextStr = "\n\nRELEVANT MEMORIES FROM PAST CONVERSATIONS:\n" + 
          finalSurvivingMemories.map(mem => `[${mem.title} - ${mem.category}]\n${mem.memory}`).join("\n\n");
        memoryFound = true;
      }
    } catch (err) {
      console.warn("Memory search failed, proceeding without memory:", err);
    }
  }

  // Step 2: Full streaming call with optional memory context
  const systemInstruction = memoryFound
    ? DEFAULT_SYSTEM_ROLE + memoryContextStr
    : DEFAULT_SYSTEM_ROLE;

  let searchUsed = false;
  let searchQueries: string[] = [];
  let searchSources: any[] = [];
  let replyText = "";
  let accumulatedThought = "";

  let pendingText = "";
  let pendingThought = "";
  let throttleTimeout: NodeJS.Timeout | null = null;

  const throttledOnChunk = (text: string, thought: string) => {
    pendingText = text;
    pendingThought = thought;
    if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        const parsed = parseQuestionFormXml(pendingText);
        onChunk({ text: parsed.cleanText, thought: pendingThought, questionForm: parsed.questionForm ?? undefined });
        throttleTimeout = null;
      }, 35);
    }
  };

  let streamRetries = 3;
  let streamSuccess = false;
  let useSearchTool = true;

  while (streamRetries > 0 && !streamSuccess) {
    try {
      replyText = "";
      accumulatedThought = "";

      if (signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const config: any = {
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
        ...(useSearchTool ? { tools: [{ googleSearch: {} }] } : {}),
        thinkingConfig: { thinkingLevel: 'HIGH' }
      };

      const responseStream = await callWithRetry(() => createRawStream(
        "gemma-4-26b-a4b-it",
        contents,
        config,
        signal
      ), 2, 1000, signal);

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
            for (const c of groundingMetadata.groundingChunks) {
              const title = c.web?.title || c.web?.uri || "Web Source";
              const uri = c.web?.uri || "";
              if (uri) searchSources.push({ title, uri });
            }
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

      if (useSearchTool && (errStr.includes("500") || errStr.includes("INTERNAL"))) {
        console.warn("Google Search grounding failed on Gemma model with 500 error. Falling back to search-disabled request...");
        useSearchTool = false;
        streamRetries++;
        await new Promise(resolve => setTimeout(resolve, 1500));
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

  // Parse <memory_action> XML for save/delete
  const parsedXml = parseMemoryActionXml(finalReplyText);
  finalReplyText = parsedXml.cleanText;

  // Parse <question_form> XML for interactive question
  const parsedQf = parseQuestionFormXml(finalReplyText);
  finalReplyText = parsedQf.cleanText;
  const questionForm = parsedQf.questionForm;

  onChunk({ text: finalReplyText, thought: finalThought, questionForm });

  let newMemoryCreated: MemoryRecord | undefined = undefined;
  let deletedMemoryId: string | undefined = undefined;

  if (parsedXml.shouldDelete && parsedXml.deleteMemoryTitle) {
    const queryClean = parsedXml.deleteMemoryTitle.trim().toLowerCase();
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

  if (parsedXml.shouldSave && parsedXml.memory) {
    const memoryVector = await embedText(parsedXml.memory, "RETRIEVAL_DOCUMENT");
    const randomIdSuffix = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 10);

    newMemoryCreated = {
      id: "mem_" + randomIdSuffix,
      title: parsedXml.title || "User Preference Note",
      description: parsedXml.description || "Inferred from conversation.",
      category: parsedXml.category || "General",
      memory: parsedXml.memory,
      importance: parsedXml.importance,
      createdAt: Date.now(),
      embedding: memoryVector
    };
  }

  const trace: TraceRecord = {
    queryText: userQuery,
    queryEmbeddingLength: queryVector.length,
    retrievalTable: scoredList,
    systemInstructionSent: systemInstruction,
    searchUsed,
    searchQueries,
    searchSources,
    thinkingLevel: 'High',
    evalResult: {
      shouldSave: parsedXml.shouldSave,
      shouldDelete: parsedXml.shouldDelete,
      deleteMemoryTitle: parsedXml.deleteMemoryTitle,
      reason: "Parsed from response XML block.",
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
    rerankerTable: [],
    totalMemoriesStored: memories.length,
    semanticSearchReturned: memories.length,
    passedScoreThreshold: candidatePool.length,
    passedLlmRelevanceCheck: 0,
    injectedIntoModelContext: finalSurvivingMemories.length,
    candidatePoolSize: CANDIDATE_POOL_SIZE,
    candidatesPassedToLlm: candidatePool.length,
    relevantMemoriesReturned: 0,
    finalContextSelection: [],
    memoryRequired: memoryFound,
    decisionReason: memoryFound
      ? `Memory searched for user query — ${finalSurvivingMemories.length} results injected.`
      : "No relevant memories found for user query."
  };

  return {
    replyText: finalReplyText,
    trace,
    newMemoryCreated,
    deletedMemoryId,
    questionForm
  };
}

/**
 * Parses a <memory_action> XML block from the model's response text.
 * Extracts save/delete actions and returns cleaned text (with XML stripped).
 */
function parseMemoryActionXml(text: string): {
  cleanText: string;
  shouldSave: boolean;
  shouldDelete: boolean;
  deleteMemoryTitle: string;
  title: string;
  description: string;
  category: string;
  memory: string;
  importance: number;
} {
  const result = {
    cleanText: text,
    shouldSave: false,
    shouldDelete: false,
    deleteMemoryTitle: "",
    title: "",
    description: "",
    category: "",
    memory: "",
    importance: 5
  };

  const selfClosing = text.match(/<memory_action\s*\/>\s*$/i);
  if (selfClosing) {
    result.cleanText = text.slice(0, selfClosing.index).trimEnd();
    return result;
  }

  const match = text.match(/<memory_action>([\s\S]*?)<\/memory_action>/i);
  if (!match) return result;

  const xmlContent = match[1];
  result.cleanText = text.replace(/<memory_action>[\s\S]*?<\/memory_action>/, "").trimEnd();

  const saveMatch = xmlContent.match(/<save>([\s\S]*?)<\/save>/i);
  if (saveMatch) {
    result.shouldSave = true;
    const s = saveMatch[1];
    const t = s.match(/<title>([\s\S]*?)<\/title>/i);
    if (t) result.title = t[1].trim();
    const d = s.match(/<description>([\s\S]*?)<\/description>/i);
    if (d) result.description = d[1].trim();
    const c = s.match(/<category>([\s\S]*?)<\/category>/i);
    if (c) result.category = c[1].trim();
    const m = s.match(/<memory>([\s\S]*?)<\/memory>/i);
    if (m) result.memory = m[1].trim();
    const imp = s.match(/<importance>([\s\S]*?)<\/importance>/i);
    if (imp) result.importance = Math.max(1, Math.min(10, parseInt(imp[1].trim(), 10) || 5));
  }

  const deleteMatch = xmlContent.match(/<delete>([\s\S]*?)<\/delete>/i);
  if (deleteMatch) {
    result.shouldDelete = true;
    const dl = deleteMatch[1].match(/<title>([\s\S]*?)<\/title>/i);
    if (dl) result.deleteMemoryTitle = dl[1].trim();
  }

  return result;
}

/**
 * Parses a <question_form> XML block from the model's response text.
 * Extracts question and options, returns cleaned text with the XML stripped.
 */
function parseQuestionFormXml(text: string): {
  cleanText: string;
  questionForm: { question: string; options: string[] } | null;
} {
  const match = text.match(/<question_form>([\s\S]*?)<\/question_form>/i);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 2) {
        const cleanText = text.replace(/<question_form>[\s\S]*?<\/question_form>/, "").trimEnd();
        return {
          cleanText,
          questionForm: {
            question: parsed.question,
            options: parsed.options.slice(0, 4)
          }
        };
      }
    } catch {}
  }

  // Strip incomplete/in-progress <question_form> tag (still streaming)
  const partialMatch = text.match(/<question_form>[\s\S]*$/i);
  if (partialMatch) {
    return { cleanText: text.slice(0, partialMatch.index).trimEnd(), questionForm: null };
  }

  return { cleanText: text, questionForm: null };
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