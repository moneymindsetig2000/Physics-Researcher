export interface MemoryRecord {
  id: string;            // e.g. "mem_" + random suffix
  title: string;
  description: string;
  category: string;      // free text, e.g. "User Preference", "Research Project", "Research Note"
  memory: string;         // the actual fact/instruction text
  importance: number;     // 0–10
  createdAt: number;      // Date.now() timestamp, used for recency scoring
  embedding: number[];    // full embedding vector from gemini-embedding-2-preview
}

export interface RetrievalScoreRow {
  title: string;
  category: string;
  cosineSim: number;
  keywordScore: number;
  fusedScore: number;
  finalRankScore: number;
  status: 'Included' | 'Below threshold';
}

export interface RerankerScoreRow {
  title: string;
  relevant: boolean;
  confidence: number;
  reason: string;
  status: 'Included' | 'Removed';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TraceRecord {
  queryText: string;
  queryEmbeddingLength: number;
  retrievalTable: RetrievalScoreRow[];
  systemInstructionSent: string;
  searchUsed: boolean;
  searchQueries: string[];
  searchSources: GroundingSource[];
  thinkingLevel: string;
  evalResult: {
    shouldSave: boolean;
    shouldDelete?: boolean;
    deleteMemoryTitle?: string;
    reason: string;
    newMemory?: Omit<MemoryRecord, 'embedding'>;
  };
  rerankerTable?: RerankerScoreRow[];
  totalMemoriesStored?: number;
  semanticSearchReturned?: number;
  passedScoreThreshold?: number;
  passedLlmRelevanceCheck?: number;
  injectedIntoModelContext?: number;
  candidatePoolSize?: number;
  candidatesPassedToLlm?: number;
  relevantMemoriesReturned?: number;
  finalContextSelection?: { rank: number; title: string; confidence: number; finalScore: number }[];
  memoryRequired?: boolean;
  decisionReason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  trace?: TraceRecord; // Only on assistant turns
}
