# Memory Tracker Documentation

This document explains the complete memory workflow in the AI integration system, including how memories are stored, retrieved, evaluated, and managed.

---

## Overview

The memory system uses a **10-step pipeline** to handle long-term memory for conversations. It retrieves relevant memories from past conversations, evaluates their relevance to the current query, and optionally saves new memories based on the conversation.

---

## Memory Data Structure

Each memory is stored as a `MemoryRecord` with the following fields:

```typescript
interface MemoryRecord {
  id: string;           // Unique identifier (e.g., "mem_abc12345")
  title: string;        // Short title for the memory
  description: string;  // Brief description
  category: string;     // Category (e.g., "General", "Physics", "Preferences")
  memory: string;       // The actual memory content
  importance: number;   // 0-10 scale (10 = most important)
  createdAt: number;    // Timestamp when created
  embedding: number[];  // Vector embedding for semantic search
}
```

---

## The 10-Step Memory Pipeline

### Step 1: Memory Requirement Decision

**Purpose:** Determine if long-term memory is needed for the current query.

**Process:**
1. User sends a query
2. AI evaluates if the query requires context from past conversations
3. Returns `memoryRequired: true/false` with a reason

**Examples:**
- **Memory NOT required:** "Hi", "What is 2+2?", "Explain string theory"
- **Memory IS required:** "What did we discuss earlier?", "Continue my research on black holes"

**Code Location:** `runQueryPipeline` and `runQueryPipelineStream` in `gemini.ts`

---

### Step 2: Query Embedding

**Purpose:** Convert the user's query into a vector for semantic search.

**Process:**
1. User query is sent to the embedding model
2. Returns a vector (array of numbers) representing the query's meaning

**Code Location:** `embedText()` function in `gemini.ts`

---

### Step 3: Vector Similarity Ranking

**Purpose:** Find memories that are semantically similar to the query.

**Process:**
1. Compare query vector against all stored memory vectors
2. Calculate similarity scores using:
   - **Semantic Weight:** 70% (embedding cosine similarity)
   - **Keyword Weight:** 30% (keyword overlap)
3. Rank memories by score
4. Select top candidates (up to `CANDIDATE_POOL_SIZE = 10`)

**Code Location:** `rankMemories()` in `pipeline.ts`

---

### Step 4: LLM Relevance Reranking (BATCH OPTIMIZED)

**Purpose:** Use AI to evaluate if each candidate memory is actually relevant to the query.

**Process (BATCH - 1 API Call):**
1. All candidate memories are sent in a SINGLE API call
2. AI evaluates each memory and returns a JSON array with relevance scores
3. Each memory gets:
   - `relevant: boolean` - Is it helpful for this query?
   - `confidence: number` (0-1) - How confident is the AI?
   - `reason: string` - Why is it relevant/irrelevant?

**Optimization:** Before this fix, the system made **1 API call PER memory** (up to 10 calls). Now it makes **1 API call for ALL memories**, providing a **10x speedup**.

**Filtering:**
- Memories must have `relevant: true`
- Memories must have `finalRankScore >= RELEVANCE_THRESHOLD (0.55)`
- Top `MAX_CONTEXT_MEMORIES (3)` are selected

**Code Location:** Batch reranker in `runQueryPipeline` and `runQueryPipelineStream`

---

### Step 5: System Instruction Building

**Purpose:** Create a system instruction that includes the relevant memories.

**Process:**
1. Take the top 3 relevant memories
2. Format them into a system instruction
3. This instruction is sent with the main query to give the AI context

**Example Output:**
```
You are a helpful research assistant. Here are relevant memories from past conversations:

Memory 1: User is studying Schwarzschild black holes and gravity.
Memory 2: User wants to learn the difference between Newton and Einstein.
Memory 3: User prefers detailed explanations with equations.
```

**Code Location:** `formatSystemInstruction()` in `pipeline.ts`

---

### Step 6: Main Response Generation

**Purpose:** Generate the AI response using the query + memory context.

**Process:**
1. User query is sent with the system instruction (containing memories)
2. AI generates a response that considers the memory context
3. Response is streamed back to the user

**Configuration:**
- Model: `Jessie`
- Thinking Level: `HIGH` (enables step-by-step reasoning)
- Temperature: `0.7` (configurable)
- Top P: `0.90` (configurable)

**Code Location:** Main response call in `runQueryPipeline` and `runQueryPipelineStream`

---

### Step 7: Memory Evaluation

**Purpose:** Determine if the conversation produced new memories to save or delete.

**Process:**
1. AI reviews the conversation (user query + AI response)
2. Evaluates:
   - Did the user state a new preference, fact, or project detail?
   - Did the user ask to delete a previously saved memory?
3. Returns evaluation with:
   - `shouldSave: boolean`
   - `shouldDelete: boolean`
   - `deleteMemoryTitle: string` (if deleting)
   - `title`, `description`, `category`, `memory` (if saving)
   - `importance: number` (0-10)

**Code Location:** Memory evaluation step in `runQueryPipeline` and `runQueryPipelineStream`

---

### Step 8: Memory Deletion (if applicable)

**Purpose:** Delete a memory if the user explicitly requested it.

**Process:**
1. If `shouldDelete: true`, find the matching memory by:
   - Exact ID match
   - Exact title match
   - Partial title match
2. Remove the memory from storage
3. Update localStorage

**Code Location:** Memory deletion logic in `runQueryPipeline` and `runQueryPipelineStream`

---

### Step 9: Memory Creation (if applicable)

**Purpose:** Create a new memory if the conversation produced valuable information.

**Process:**
1. If `shouldSave: true` and `memory` is provided:
   - Generate embedding for the new memory
   - Create a unique ID (e.g., "mem_abc12345")
   - Set importance (0-10, clamped)
   - Add to memories array
   - Save to localStorage

**Code Location:** Memory creation logic in `runQueryPipeline` and `runQueryPipelineStream`

---

### Step 10: Pipeline Trace (Diagnostics)

**Purpose:** Record detailed diagnostics about the entire pipeline execution.

**Process:**
1. Collect all data from Steps 1-9
2. Create a `TraceRecord` with:
   - Query text and embedding length
   - Retrieval table (all scored memories)
   - System instruction sent
   - Search queries and sources
   - Thinking level used
   - Evaluation results
   - Reranker table (all memories with relevance scores)
   - Final context selection

**Code Location:** Trace creation at the end of `runQueryPipeline` and `runQueryPipelineStream`

---

## Memory Storage

### localStorage Keys

| Key | Description |
|-----|-------------|
| `physica_ai_memories` | Array of all `MemoryRecord` objects |
| `physica_ai_chats` | Array of chat objects with messages |

### Storage Structure

```json
{
  "id": "mem_abc12345",
  "title": "User Preference Note",
  "description": "Inferred from conversation.",
  "category": "General",
  "memory": "User is interested in black hole gravity forces",
  "importance": 7,
  "createdAt": 1688901234567,
  "embedding": [0.123, 0.456, ...]
}
```

---

## Configuration Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CANDIDATE_POOL_SIZE` | 10 | Max memories to consider for reranking |
| `MAX_CONTEXT_MEMORIES` | 3 | Max memories to inject into system instruction |
| `RELEVANCE_THRESHOLD` | 0.55 | Minimum score to be considered relevant |
| `SEMANTIC_WEIGHT` | 0.7 | Weight for embedding similarity |
| `KEYWORD_WEIGHT` | 0.3 | Weight for keyword overlap |
| `IMPORTANCE_BOOST_FACTOR` | 50 | Factor for importance scoring |
| `RECENCY_WEIGHT` | 0.05 | Weight for recent memories |

---

## Performance Optimization: Batch Reranker

### Problem (Before Fix)
- The reranker made **1 API call PER memory**
- With `CANDIDATE_POOL_SIZE = 10`, that's **10 sequential API calls**
- Each call had ~44s latency
- **Total: 10 × 44s = 440 seconds (7+ minutes)**

### Solution (After Fix)
- All memories are sent in a **SINGLE API call**
- AI evaluates all memories at once and returns a JSON array
- **Total: 1 × 44s = 44 seconds**

### Speedup
- **10x faster** for the reranking step
- Response time reduced from ~440s to ~44s

### Code Changes
- **Non-streaming pipeline:** Lines 190-307 in `gemini.ts`
- **Streaming pipeline:** Lines 600-721 in `gemini.ts`

---

## Error Handling

### Retry Logic
- API calls are retried up to **6 times** for reranker
- Exponential backoff: 2000ms, 4000ms, 8000ms, etc.
- Retries on: 500, 503, UNAVAILABLE, INTERNAL, RESOURCE_EXHAUSTED

### Fallback Behavior
- If batch reranker fails, all memories are marked as failed
- If memory evaluation fails, no new memories are saved/deleted
- If embedding fails, the pipeline continues without memory context

---

## Flow Diagram

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│ Step 1: Memory Required?            │
│   - Yes → Continue to Step 2        │
│   - No → Skip to Step 6             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 2: Embed Query                 │
│   - Convert query to vector         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 3: Vector Ranking              │
│   - Find similar memories           │
│   - Select top 10 candidates        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 4: Batch Reranker (1 API Call) │
│   - Evaluate all 10 memories        │
│   - Return relevance scores         │
│   - Select top 3                    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 5: Build System Instruction    │
│   - Format memories into context    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 6: Generate Response           │
│   - Query + Memory Context          │
│   - Stream response to user         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 7: Evaluate Memory             │
│   - Should save new memory?         │
│   - Should delete old memory?       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 8-9: Save/Delete Memory        │
│   - Update localStorage             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Step 10: Record Trace               │
│   - Log diagnostics                 │
└─────────────────────────────────────┘
    │
    ▼
  Response
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/utils/ai/gemini.ts` | Main pipeline implementation |
| `src/utils/pipeline/pipeline.ts` | Memory ranking and formatting |
| `src/utils/ai/config.ts` | Configuration constants |
| `src/utils/ai/types.ts` | TypeScript type definitions |
| `src/components/chatpage/ChatPage.tsx` | Frontend integration |
