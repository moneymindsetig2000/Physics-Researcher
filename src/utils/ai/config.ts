// Config file for Gemini API integration
export const GEMINI_API_KEY: string = "AIzaSyB7cxaeZhWMy61WGxWQkj3FoKFD0WJeiRs";

// Model inference default settings (Gemma 4 configuration)
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_TOP_P = 0.90;
export const DEFAULT_CUSTOM_INSTRUCTIONS = "";


// Configurable Ranking Constants
export const TOP_K = 5;
export const RELEVANCE_THRESHOLD = 0.55;   // anything scoring below this is dropped entirely
export const SEMANTIC_WEIGHT = 0.7;        // weight of embedding cosine similarity
export const KEYWORD_WEIGHT = 0.3;         // weight of keyword overlap score
export const IMPORTANCE_BOOST_FACTOR = 50; // higher = importance matters less
export const RECENCY_WEIGHT = 0.05;        // small nudge toward newer memories
export const RECENCY_DECAY_DAYS = 365;     // recency boost fades to 0 after this many days

export const CANDIDATE_POOL_SIZE = 10;
export const MAX_CONTEXT_MEMORIES = 3;
