# Physica AI — State Management

## Philosophy

No external state library. All state is managed via React hooks (`useState`, `useRef`, `useEffect`) and lifted to `ChatPage.tsx` as the orchestrator.

## State Locations

| State | Location | Type |
|-------|----------|------|
| Memories | `ChatPage.tsx` | `MemoryRecord[]` (from `localStorage`) |
| Active chat | `ChatPage.tsx` | `Chat \| null` |
| Chat list | `ChatPage.tsx` | `Chat[]` |
| Is generating | `ChatPage.tsx` | `boolean` |
| Message text | `ChatWorkspace.tsx` | `string` |
| Preview image | `ChatWorkspace.tsx` | `string \| null` |
| Preview PDF | `ChatWorkspace.tsx` | `string \| null` |
| Tagged text | `ChatWorkspace.tsx` | `string \| null` |
| Selection state | `ChatWorkspace.tsx` | `{ text, position } \| null` |
| Sidebar open | `ChatPage.tsx` | `boolean` (left + right) |
| Settings open | `ChatPage.tsx` | `boolean` |
| Version map | `ChatWorkspace.tsx` | `Record<string, number>` — maps `userMsgId → active version index` |

## Message Data Model

Each `Message` (user) includes an optional `versions[]` array:

```ts
versions?: {
  text: string;
  responseText?: string;
  responseThought?: string;
}[]
```

- `versions[]` stores historical user+AIA message pairs (text, response, thought)
- The current message text lives in `msg.text`; old versions are prepended when editing
- `allVersions = [...msg.versions, { text: msg.text }]` — the last entry is always the latest

## Edit Flow State

- `isEditing` / `editText` — local state in `MessageItem` for the textarea/Cancel/Send UI
- `versionMap` — lifted to `ChatWorkspace`, shared between user and AI MessageItems
- `displayText` / `displayResponseText` / `displayResponseThought` — derived variables in `MessageItem` that pull from `allVersions[activeVersion]` when viewing an older version, or fall through to live `msg.text`/typewriter state

## Data Flow

```
User Action
  → ChatPage sets isGenerating = true
  → ChatPage calls runQueryPipelineStream()
  → Pipeline streams chunks via callback
  → ChatWorkspace updates message content
  → Pipeline completes → ChatPage saves memory + trace
  → ChatPage sets isGenerating = false
```

## Persistence

All persistent data uses `localStorage`:

| Key | Data | Format |
|-----|------|--------|
| `physica_ai_memories` | Memory records | `MemoryRecord[]` |
| `physica_ai_chats` | Chat sessions | `Chat[]` |

No backend database. Client-side only.
