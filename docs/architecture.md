# Physica AI — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 React 19 + Vite 8 App                    │ │
│  │  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │  Landing  │  │  Chat Page   │  │  Right Sidebar   │  │ │
│  │  │   Page    │  │  (Workspace) │  │  (File Browser)  │  │ │
│  │  └───────────┘  └──────┬───────┘  └──────────────────┘  │ │
│  │                        │                                 │ │
│  │  ┌─────────────────────▼──────────────────────────────┐  │ │
│  │  │              AI Pipeline (gemini.ts)                │  │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │ │
│  │  │  │Embedding │  │ Ranking  │  │ Raw REST Stream  │  │ │ │
│  │  │  │ (SDK)    │  │(pipeline)│  │ (fetch + SSE)    │  │ │ │
│  │  │  └──────────┘  └──────────┘  └────────┬─────────┘  │ │ │
│  │  └────────────────────────────────────────┼────────────┘  │ │
│  └───────────────────────────────────────────┼───────────────┘  │
│                                               │                  │
└───────────────────────────────────────────────┼──────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                    our server                             │
                    │  ┌──────────────────┐  ┌──────────────────────────┐   │
                    │  │  Embedding API   │  │  Jessie Streaming API    │   │
                    │  │  (embedding)     │  │  (streamGenerate)        │   │
                    │  └──────────────────┘  └──────────────────────────┘   │
                    │  ┌──────────────────┐                                │
                    │  │  File API        │                                │
                    │  │  (PDF upload)    │                                │
                    │  └──────────────────┘                                │
                    └──────────────────────────────────────────────────────┘
```

## Client-Side Only

All data resides in `localStorage`. No backend server or database.

## Key Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Entry | `src/main.tsx` | React bootstrapping |
| Routing | `src/App.tsx` | Landing page / chat toggle via hash |
| Chat Orchestrator | `src/components/chatpage/ChatPage.tsx` | Manages chats, memories, pipeline |
| Workspace | `src/components/chatpage/chat/ChatWorkspace.tsx` | Messages, thinking box, loader |
| AI Pipeline | `src/utils/ai/gemini.ts` | Embedding, streaming, memory XML |
| Memory Ranking | `src/utils/pipeline/pipeline.ts` | Semantic + keyword scoring |
| System Role | `src/utils/systemroles/systemroles.ts` | Jessie's identity definition |
| Configuration | `src/utils/ai/config.ts` | Constants, thresholds |

## Data Flow

1. User types message → `ChatPage` invokes `runQueryPipelineStream()`
2. Pipeline embeds query → ranks memories → assembles system instruction
3. Raw REST streaming to Jessie → chunks parsed → UI updated
4. Memory XML parsed at end → memories saved/deleted in `localStorage`
