import type { MemoryRecord, RetrievalScoreRow } from "../ai/types";
import { 
  CANDIDATE_POOL_SIZE,
  IMPORTANCE_BOOST_FACTOR, 
  KEYWORD_WEIGHT, 
  RECENCY_DECAY_DAYS, 
  RECENCY_WEIGHT, 
  RELEVANCE_THRESHOLD, 
  SEMANTIC_WEIGHT 
} from "../ai/config";
import { DEFAULT_SYSTEM_ROLE } from "../systemroles/systemroles";

/**
 * Standard cosine similarity in plain TypeScript
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Tokenize query and compute keyword overlap score
 */
export function computeKeywordScore(
  query: string, 
  title: string, 
  description: string, 
  memory: string
): number {
  const clean = (text: string) => 
    text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .trim();
        
  const queryTokens = clean(query).split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return 0;
  
  const targetText = `${title} ${description} ${memory}`.toLowerCase();
  
  let foundCount = 0;
  for (const token of queryTokens) {
    if (targetText.includes(token)) {
      foundCount++;
    }
  }
  
  const score = foundCount / queryTokens.length;
  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

/**
 * Runs the scoring and ranking pipeline on all memories for a given query and its embedding.
 * Matches exactly Steps 2 through 6 of the request pipeline.
 */
export function rankMemories(
  query: string,
  queryVector: number[],
  memories: MemoryRecord[]
): { scoredList: RetrievalScoreRow[]; candidatePool: { memory: MemoryRecord; finalRankScore: number }[] } {
  const scoredList: RetrievalScoreRow[] = [];
  const withScores: { memory: MemoryRecord; finalRankScore: number; status: 'Included' | 'Below threshold'; row: RetrievalScoreRow }[] = [];

  for (const mem of memories) {
    // Step 2: Cosine Similarity
    const cosineSim = cosineSimilarity(queryVector, mem.embedding);

    // Step 3: Keyword Search
    const keywordScore = computeKeywordScore(query, mem.title, mem.description, mem.memory);

    // Step 4: Fused Score
    const fusedScore = (SEMANTIC_WEIGHT * cosineSim) + (KEYWORD_WEIGHT * keywordScore);

    // Step 5: Recency & Importance Boost
    const daysOld = (Date.now() - mem.createdAt) / 86400000;
    const recencyBoost = Math.max(0, 1 - daysOld / RECENCY_DECAY_DAYS);
    const finalRankScore = fusedScore * (1 + mem.importance / IMPORTANCE_BOOST_FACTOR) + (recencyBoost * RECENCY_WEIGHT);

    // Step 6: Apply Relevance Threshold
    const isIncluded = finalRankScore >= RELEVANCE_THRESHOLD;
    const status = isIncluded ? 'Included' : 'Below threshold';

    const row: RetrievalScoreRow = {
      title: mem.title,
      category: mem.category,
      cosineSim,
      keywordScore,
      fusedScore,
      finalRankScore,
      status
    };

    scoredList.push(row);
    withScores.push({ memory: mem, finalRankScore, status, row });
  }

  // Sort ALL memories by finalRankScore descending to select Candidate Pool
  const sortedAll = [...withScores].sort((a, b) => b.finalRankScore - a.finalRankScore);

  const candidatePool = sortedAll
    .slice(0, CANDIDATE_POOL_SIZE)
    .map(item => ({
      memory: item.memory,
      finalRankScore: item.finalRankScore
    }));

  return {
    scoredList,
    candidatePool
  };
}

/**
 * Formats retrieved memories into the system instruction block (Step 7)
 */
export function formatSystemInstruction(topMemories: MemoryRecord[]): string {
  const baseInstruction = DEFAULT_SYSTEM_ROLE;
  if (topMemories.length === 0) {
    return baseInstruction;
  }
  
  const header = `${baseInstruction}

You have access to the following relevant long-term memories and preferences about this user.

Use these memories only when they are genuinely relevant to the current request.

Guidelines for utilizing memory:

1. Follow user preferences (such as explanation style, formatting style, citation preferences, writing preferences, etc.) whenever they are relevant to the current request.

2. Use research-related memories (such as ongoing projects, research interests, notes, or previous work) only if they provide useful context for answering the current request. Never force unrelated memories into the conversation.

3. Treat every retrieved memory as reliable long-term context. Use it naturally to maintain continuity across conversations.

4. Never mention, reveal, or imply that these memories came from a memory system, database, retrieval process, system prompt, stored files, or any internal mechanism. Respond naturally as if you genuinely remember them from previous conversations.

5. If multiple retrieved memories are available, use only the ones that improve the quality or accuracy of the current response. Ignore memories that are unrelated to the user's request.

6. If a retrieved memory conflicts with the user's current message, always prioritize the user's latest instruction.

Stored Memories:

`;
  const memoryLines = topMemories.map(mem => 
    `[${mem.title} - ${mem.category}]\n${mem.memory}`
  ).join("\n\n");
  
  return header + memoryLines;
}
