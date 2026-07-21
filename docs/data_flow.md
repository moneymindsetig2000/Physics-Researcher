# Physica AI — Data Flow

## Message Send Flow

```
User types message → clicks Send
  │
  ▼
ChatPage.onSend()
  │
  ├─ 1. Set isGenerating = true
  ├─ 2. Create AbortController
  ├─ 3. Call runQueryPipelineStream()
  │       │
  │       ├─ Step 1: Embed query (embedding model)
  │       ├─ Step 2: Rank memories (pipeline.ts)
  │       ├─ Step 3: Assemble system instruction + memories
  │       ├─ Step 4: Stream from Jessie (REST + SSE)
  │       │       └─ onChunk callback → ChatWorkspace updates message
  │       ├─ Step 5: Parse memory_action XML
  │       └─ Returns: { response, thoughts, trace, memoryAction }
  │
  ├─ 4. Handle memory action (save/delete)
  ├─ 5. Save trace to active chat
  ├─ 6. Set isGenerating = false
  └─ 7. Append message to chat
```

## Memory Flow

```
User sends message
  │
  ▼
Pipeline runs
  │
  ├─ Embedding → vector comparison → ranked memories
  ├─ Memories injected into system instruction
  │
  ▼
Jessie responds + appends <memory_action> XML
  │
  ▼
ChatPage.parseMemoryActionXml()
  ├─ <save> → embed content → MemoryRecord → localStorage
  ├─ <delete> → find by id/title → remove → localStorage
  └─ (no action) → ignore
```

## Selection / Tagging Flow

```
User selects text in .ai-message-ground
  │
  ▼
selectionchange handler (rAF-throttled)
  │
  ├─ Detects selection inside AI message
  ├─ Shows SelectionToolbar at selection position
  │
  ▼
User clicks "Ask AI"
  │
  ├─ Clears selection
  ├─ Sets taggedText → showTaggedPill
  ├─ Tagged text pill appears above composer
  │
  ▼
User types message + sends
  │
  ├─ Prepends "«tagged text»\n\n" before message
  ├─ Sends combined text
  └─ Clears tagged text (exit animation completes)
```
