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
