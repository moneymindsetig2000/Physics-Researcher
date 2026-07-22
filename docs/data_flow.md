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

## Message Edit Flow

```
User clicks edit pencil on user message
  │
  ▼
MessageItem → handleEditStart()
  │  ├─ Sets isEditing = true
  │  └─ Expands textarea with current text
  │
User edits text → clicks Send
  │
  ▼
MessageItem → handleEditSend()
  │  └─ Calls onEditMessage(msgId, newText)
  │
  ▼
ChatWorkspace → handleEditMessage()
  │  ├─ Calls onEditPrompt(userMsgId, newText, aiMsgId)
  │  └─ Sets versionMap[userMsgId] = latest version index
  │
  ▼
ChatPage → handleEditPrompt()
  │  ├─ Saves old user text + old AI response+thought into
  │  │   msg.versions[] on the user message
  │  ├─ Clears AI message: text='', thought=undefined, trace=undefined
  │  ├─ Sets isGenerating = true
  │  ├─ Calls runQueryPipelineStream() with full history above
  │  │   the edited message (messages.slice(0, msgIndex))
  │  └─ On each chunk → updates AI message text (same msg.id)
  │
  ▼
Typewriter effect re-fires (isGenerating changed)
  │  ├─ Resets displayedText to ''
  │  └─ Starts RAF loop for character-by-character reveal
  │
Pipeline completes → AI message has full response
  │  └─ isGenerating = false → full text revealed
```

## Version Switching Flow

```
User clicks < or > on the version switcher
  │
  ▼
ChatWorkspace → handleVersionChange(userMsgId, version)
  │  └─ Sets versionMap[userMsgId] = new version index
  │
  ▼
Message loops recalculate displayText/displayResponseText:
  │  ├─ activeVersion = versionMap[userMsgId]
  │  ├─ allVersions = [...msg.versions, { text: currentMsg.text }]
  │  └─ activeVersion < totalVersions → pulls from allVersions[]
  │
User sees the old user prompt + old AI response (read-only)
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
