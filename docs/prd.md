# Physica AI — Product Requirements Document (PRD)

> **Product Name:** Physica AI  
> **Code Name:** Researcher  
> **Tagline:** "The Research Partner Built For Physics."  
> **Version:** 0.0.0  
> **Stack:** React 19 + Vite 8 + TypeScript 6 + Google Jessie

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Audience](#2-target-audience)
3. [Core Features](#3-core-features)
4. [Architecture Overview](#4-architecture-overview)
5. [Tech Stack & Dependencies](#5-tech-stack--dependencies)
6. [Project Structure](#6-project-structure)
7. [Getting Started](#7-getting-started)
8. [NPM Commands](#8-npm-commands)
9. [Configuration](#9-configuration)
10. [AI Pipeline](#10-ai-pipeline)
11. [Memory System](#11-memory-system)
12. [UI Component Breakdown](#12-ui-component-breakdown)
13. [API Integration Details](#13-api-integration-details)
14. [Error Handling & Resilience](#14-error-handling--resilience)
15. [Data Storage](#15-data-storage)
16. [Related Documentation](#16-related-documentation)

---

## 1. Product Overview

Physica AI is an AI-powered research platform built specifically for physics researchers, professors, PhD students, masters students, research groups, academic institutions, and anyone working with scientific literature.

The platform is designed to help users discover, understand, analyze, summarize, and explore research papers significantly faster than traditional academic workflows. Rather than functioning as a general-purpose chatbot, Physica AI acts as a specialized research partner focused on physics and related scientific disciplines.

**Primary Brand Identity:** The AI assistant is named **Jessie** — the intelligent reasoning engine behind Physica AI.

### Vision

Modern researchers face an overwhelming amount of scientific literature. Thousands of new papers are published every month across multiple repositories and disciplines. Finding relevant work, understanding technical content, comparing approaches, extracting insights, and identifying research gaps often requires hours or days of manual effort. Physica AI aims to become the intelligent research companion that assists researchers throughout the entire paper exploration process.

### Mission

- Discover relevant research faster
- Understand complex papers more easily
- Analyze scientific literature more deeply
- Reduce repetitive reading tasks
- Generate higher quality research insights
- Improve literature review workflows
- Accelerate scientific learning

---

## 2. Target Audience

| Audience | Primary Need |
|----------|-------------|
| **Researchers** | Literature reviews, citation exploration, related work discovery |
| **Professors** | Rapid paper evaluation, student guidance, research monitoring |
| **PhD Students** | Faster understanding, research direction, gap identification |
| **Masters Students** | Simplified explanations, guided learning, concept understanding |
| **Research Groups** | Shared understanding, collaborative research, faster discovery |

---

## 3. Core Features

### 3.1 Research Paper Discovery
- Locate relevant papers based on topics, concepts, keywords, authors, and research domains
- Search across scientific repositories (arXiv, INSPIRE, NASA ADS)

### 3.2 Paper Understanding
- Generate summaries, explanations, simplifications, and concept breakdowns
- Upload PDFs for analysis via File API

### 3.3 Research Question Answering
- Ask questions about papers and receive contextual answers
- Multi-turn conversation with memory of past discussions

### 3.4 Long-Term Memory
- Automatically save user preferences, research topics, and project details
- Retrieve relevant memories across sessions via semantic vector search
- Delete memories on user request

### 3.5 Web Search Grounding
- Google Search integration for up-to-date information
- Automatically falls back to non-search mode on 500 errors

### 3.6 Thinking / Reasoning
- Step-by-step internal reasoning via Jessie's thinking mode
- Visible thinking box with expand/collapse and auto-scroll

### 3.7 PDF Processing
- Upload PDFs via Google File API (not inlineData)
- Polling-based processing status monitoring

### 3.8 LaTeX / Math Rendering
- KaTeX-based rendering of mathematical equations
- Inline and block math support

### 3.9 Conversation Management
- Multiple chat sessions with history
- Stop generation mid-stream
- Smooth auto-scrolling as responses stream in

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │              React 19 + Vite 8 App                  │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ Landing  │  │   ChatPage   │  │   Right     │  │  │
│  │  │  Page    │  │  (Workspace) │  │  Sidebar    │  │  │
│  │  └──────────┘  └──────┬───────┘  └─────────────┘  │  │
│  │                       │                            │  │
│  │  ┌────────────────────▼──────────────────────────┐ │  │
│  │  │            AI Pipeline (gemini.ts)             │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │ │  │
│  │  │  │ Embedding│  │ Ranking  │  │ Raw REST    │  │ │  │
│  │  │  │ (SDK)    │  │ (pipeline│  │ Streaming   │  │ │  │
│  │  │  │          │  │ .ts)     │  │ (fetch+SSE) │  │ │  │
│  │  │  └──────────┘  └──────────┘  └──────┬──────┘  │ │  │
│  │  └──────────────────────────────────────┼─────────┘  │  │
│  └─────────────────────────────────────────┼────────────┘  │
│                                            │                │
└────────────────────────────────────────────┼────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │           Google AI API (HTTPS)                │
                    │  ┌─────────────────┐  ┌────────────────────┐  │
                    │  │  Embedding API  │  │  Jessie       │  │
                    │  │  (gemini-embed- │  │  StreamGenerate    │  │
                    │  │  ding-2-preview)│  │  Content (REST)    │  │
                    │  └─────────────────┘  └────────────────────┘  │
                    │  ┌─────────────────┐                          │
                    │  │  File API       │                          │
                    │  │  (PDF upload)   │                          │
                    │  └─────────────────┘                          │
                    └──────────────────────────────────────────────┘
```

---

## 5. Tech Stack & Dependencies

### Core Frameworks
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | ^19.2.7 | UI framework |
| TypeScript | ~6.0.2 | Type safety |
| Vite | ^8.1.0 | Build tool & dev server |

### AI & API
| Package | Version | Purpose |
|---------|---------|---------|
| @google/genai | ^2.10.0 | Embedding + File API (SDK) |
| — (raw fetch) | — | Main model streaming (bypasses SDK to avoid 500s) |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| framer-motion | ^12.42.0 | Animations (thinking box fade-in, loader transitions) |
| lucide-react | ^1.21.0 | Icons |
| @carbon/icons-react | ^11.82.0 | IBM Carbon icons |
| @radix-ui/react-dropdown-menu | ^2.1.18 | Accessible dropdown menus |
| clsx | ^2.1.1 | Conditional class names |
| tailwind-merge | ^3.6.0 | Tailwind class merging |
| katex | ^0.17.0 | Math equation rendering |

### 3D / Graphics
| Package | Version | Purpose |
|---------|---------|---------|
| three | ^0.184.0 | 3D graphics |
| @types/three | ^0.184.1 | Three.js types |
| ogl | ^1.0.11 | WebGL abstraction |

### Dev Tools
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^10.5.0 | Linting |
| typescript-eslint | ^8.61.0 | TypeScript ESLint |
| @vitejs/plugin-react | ^6.0.2 | React Fast Refresh |

---

## 6. Project Structure

```
/
├── .env                          # API key (gitignored)
├── .gitignore                    # Ignores .env, node_modules, dist
├── index.html                    # Entry HTML
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript project references
├── tsconfig.app.json             # App-specific TS config
├── tsconfig.node.json            # Node-specific TS config
│
├── docs/                         # Documentation
│   ├── prd.md                    # ← This file
│   ├── project.md                # Product vision & strategy
│   ├── ai_integration.md         # AI pipeline explanation (non-technical)
│   ├── chat_page_structure.md    # Chat UI layout
│   └── memory_tracker.md         # Memory system documentation
│
└── src/
    ├── main.tsx                  # React entry point
    ├── App.tsx                   # Root app (landing page / chat routing via hash)
    ├── App.css                   # Global app styles
    ├── index.css                 # Tailwind/base styles
    │
    ├── components/
    │   ├── landingpage/          # Marketing landing page sections
    │   │   ├── header/
    │   │   ├── hero/
    │   │   ├── features/
    │   │   ├── comparison/
    │   │   ├── workspacepreview/
    │   │   ├── researchsources/
    │   │   ├── designedforphysics/
    │   │   ├── ctasection/
    │   │   └── footer/
    │   │
    │   ├── chatpage/             # Main chat application
    │   │   ├── ChatPage.tsx      # Orchestrator: manages memories, chats, pipeline
    │   │   ├── ChatPage.css
    │   │   ├── chat/             # Chat workspace
    │   │   │   ├── ChatWorkspace.tsx       # Messages list + thinking box + loader
    │   │   │   ├── ChatWorkspace.css
    │   │   │   └── ui/
    │   │   │       ├── ComposerInput.tsx    # Text input + attach buttons
    │   │   │       ├── ThinkingLoader.tsx   # Rotating physics one-liners loader
    │   │   │       ├── ShinyText.tsx        # Animated gradient shine text
    │   │   │       ├── ShinyText.css
    │   │   │       └── markdowns/          # Markdown rendering components
    │   │   │           └── MarkdownRenderer.tsx
    │   │   ├── settings/         # Settings panel
    │   │   ├── sidebar/          # Left sidebar
    │   │   └── rightsidebar/     # Right sidebar (files, media)
    │   │
    │   └── WebGLShader.tsx       # Shader art component
    │
    └── utils/
        ├── ai/
        │   ├── gemini.ts         # MAIN PIPELINE: embedding, streaming, memory XML parsing
        │   ├── config.ts         # API key (from .env), thresholds, constants
        │   ├── types.ts          # TypeScript interfaces
        │   └── seedData.ts       # Initial seed memories
        ├── pipeline/
        │   └── pipeline.ts       # Memory ranking & formatting
        └── systemroles/
            └── systemroles.ts    # Jessie's core system role / identity
```

---

## 7. Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9
- A Google AI Studio API key with access to Jessie

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd researcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your API key**
   Create a `.env` file in the project root:
   ```env
   VITE_GEMINI_API_KEY=your_google_ai_studio_key_here
   ```
   The `.env` file is already in `.gitignore` — it will never be committed.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to the URL shown in the terminal (typically `http://localhost:5173`).
   - The landing page appears by default
   - Add `#chat` to the URL hash to enter the chat workspace

---

## 8. NPM Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server with hot module replacement |
| `npm run build` | Type-check with `tsc -b` then build for production with `vite build` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the entire codebase |

---

## 9. Configuration

### File: `src/utils/ai/config.ts`

All tunable constants live in this file:

| Constant | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | `import.meta.env.VITE_GEMINI_API_KEY` | API key from `.env` |
| `DEFAULT_TEMPERATURE` | `0.7` | Model temperature |
| `DEFAULT_TOP_P` | `0.90` | Nucleus sampling |
| `TOP_K` | `5` | Top-K memories to display in trace |
| `RELEVANCE_THRESHOLD` | `0.55` | Minimum memory relevance score |
| `SEMANTIC_WEIGHT` | `0.7` | Embedding similarity weight |
| `KEYWORD_WEIGHT` | `0.3` | Keyword overlap weight |
| `IMPORTANCE_BOOST_FACTOR` | `50` | Importance score divisor |
| `RECENCY_WEIGHT` | `0.05` | Recency boost weight |
| `RECENCY_DECAY_DAYS` | `365` | Recency full decay period |
| `CANDIDATE_POOL_SIZE` | `10` | Max memories in candidate pool |
| `MAX_CONTEXT_MEMORIES` | `3` | Max memories injected into context |

### File: `.env`

```env
VITE_GEMINI_API_KEY=your_key_here
```

---

## 10. AI Pipeline

The entire AI pipeline lives in `src/utils/ai/gemini.ts` and is orchestrated by `runQueryPipelineStream()`.

### Pipeline Steps

#### Step 1: Embedding (Semantic Search)
- User query is converted to a vector using `gemini-embedding-2-preview`
- Done via `@google/genai` SDK (`embedText()` function)

#### Step 2: Memory Ranking
- `rankMemories()` in `src/utils/pipeline/pipeline.ts` compares query vector against all stored memory vectors
- Scoring: 70% semantic (cosine similarity) + 30% keyword overlap
- Recency and importance boosts applied
- Top candidates pass threshold filter (`RELEVANCE_THRESHOLD >= 0.55`)

#### Step 3: System Instruction Assembly
- Base: `DEFAULT_SYSTEM_ROLE` from `src/utils/systemroles/systemroles.ts` (Jessie's identity)
- If memories found: append formatted memory list
- No separate `MEMORY_BASE_INSTRUCTION` — the system role file is the single source of truth

#### Step 4: Streaming Generation (Raw REST)
- Uses raw `fetch()` + manual SSE parser (`createRawStream` / `sseGenerator`) — bypasses `@google/genai` SDK to avoid 500 errors
- Model: `Jessie`
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/Jessie:streamGenerateContent?alt=sse`
- Auth: `X-Goog-Api-Key` header
- Thinking mode enabled: `generationConfig: { thinkingConfig: { thinkingLevel: "HIGH" } }`
- Google Search grounding: enabled by default (`useSearchTool = true`), falls back automatically on 500
- Tools field: sent as `tools: [{ googleSearch: {} }]` when search is enabled

#### Step 5: Response Streaming
- SSE chunks parsed via `sseGenerator`
- Thought tokens vs. reply tokens separated
- Chunks throttled at 35ms intervals via `throttledOnChunk`
- `<thought>` / `<think>` tags extracted from text if not in dedicated field
- `<memory_action>` XML parsed at the end for save/delete operations

#### Step 6: Memory Action Parsing
- `parseMemoryActionXml()` extracts `<save>` or `<delete>` blocks from the model's response
- Clean text (with XML stripped) is returned to the user
- New memories are embedded and stored in `localStorage`

#### Step 7: Trace Recording
- Full `TraceRecord` created with: query, scoring table, system instruction, search metadata, memory operations
- Displayed in the UI as `PIPELINE_DIAGNOSTICS` accordion

### Model Details
- **Model ID:** `Jessie`
- **Thinking Level:** `HIGH` (uppercase — lowercase causes it to be ignored by the API)
- **Temperature:** 0.7
- **Top P:** 0.90
- **Max Retries (streaming):** 3 attempts, 1500ms delay
- **SDK Usage:** Only for embedding (`@google/genai`) and File API (PDF uploads)
- **REST Usage:** Main streaming generation

### Key Architectural Decisions
| Decision | Rationale |
|----------|-----------|
| Raw REST fetch instead of SDK for streaming | SDK request transformations caused server-side 500 errors |
| `thinkingConfig` inside `generationConfig` | Top-level `thinkingConfig` returns 400 Bad Request |
| `tools` field always present | Omitting it causes API to silently drop `thinkingConfig` |
| PDFs via File API, not inlineData | `inlineData` for PDFs causes 500 on Jessie |
| Retry delays: 1s+2s (inner), 1.5s (outer) | Minimized accumulated wait time |
| Single unified streaming pipeline | No separate non-streaming path or decision API call |

---

## 11. Memory System

### Data Structure (`MemoryRecord`)

```typescript
{
  id: string;              // e.g., "mem_abc12345"
  title: string;           // Short title
  description: string;     // Brief description
  category: string;        // "General", "Physics", "Preferences", etc.
  memory: string;          // Full memory content
  importance: number;      // 1-10
  createdAt: number;       // Unix timestamp (ms)
  embedding: number[];     // Vector for semantic search
}
```

### Storage
- **Location:** `localStorage` under key `physica_ai_memories`
- **Chat history:** `physica_ai_chats`
- **Seed data:** 4 initial records from `src/utils/ai/seedData.ts`

### Memory Action Flow
1. Model appends `<memory_action>` XML at the end of every response
2. `parseMemoryActionXml()` in `gemini.ts` extracts save/delete/no-action
3. Save: embed the memory content, create `MemoryRecord`, push to array, persist
4. Delete: match by ID, title, or partial title; remove from array; persist
5. No action: silently ignore

### Content Filtering in `buildContents()`
When building chat history for the API, all model messages are stripped of:
- `<thought>` / `</thought>` tags
- `<think>` / `</think>` tags
- `<memory_action>` XML blocks
- `<|channel>thought` channel markers

This prevents 500 errors on subsequent messages.

---

## 12. UI Component Breakdown

### Landing Page (`src/App.tsx`)
- Shown when URL hash is empty or not `#chat`
- Sections: Header, Hero, Features, Comparison, WorkspacePreview, ResearchSources, DesignedForPhysics, CTA, Footer
- Hash-based routing: `window.location.hash === "#chat"` switches to chat view

### Chat Page (`src/components/chatpage/ChatPage.tsx`)
- Manages: memories (load/save/delete), active chat, chat list
- Orchestrates `runQueryPipelineStream()` on user message send
- Handles pipeline results (new memories, deleted memories, trace)
- Left sidebar: session management
- Right sidebar: file/media browser
- Settings panel

### Chat Workspace (`src/components/chatpage/chat/ChatWorkspace.tsx`)
- Renders message list (user + AI)
- AI messages show: thinking box, main text, trace diagnostics
- **Thinking Box:** expand/collapse toggle, auto-scroll, fade-in animation (framer-motion)
- **Thinking Loader:** `<ThinkingLoader>` with rotating physics one-liners, slide-up/down animation, ShinyText effect
- **ShinyText:** `useAnimationFrame`-driven gradient shine sweep
- **Auto-scroll:** conversation flow scrolls to bottom on new messages
- **Math Rendering:** KaTeX via `MarkdownRenderer.tsx`

### Composer Input (`src/components/chatpage/chat/ui/ComposerInput.tsx`)
- Text input with send/stop buttons
- Attach images and PDFs
- Responsive width adapts to sidebar state

### Settings, Sidebars
- Settings: model configuration, display preferences
- Left sidebar: chat sessions list, search, library, history
- Right sidebar: uploaded files (images, PDFs) for quick viewing/download

---

## 13. API Integration Details

### Google AI API Endpoints Used

| Endpoint | Method | Purpose | SDK vs REST |
|----------|--------|---------|-------------|
| `models/Jessie:streamGenerateContent?alt=sse` | POST | Main model streaming | Raw REST (`fetch`) |
| `models/gemini-embedding-2-preview:embedContent` | POST | Query/memory embedding | `@google/genai` SDK |
| File API (`/files/upload`, `/files/{name}`) | POST, GET | PDF upload + status polling | `@google/genai` SDK |

### Request Format (Streaming)

```json
{
  "contents": [{ "role": "user/model", "parts": [{ "text": "..." }] }],
  "systemInstruction": { "role": "system", "parts": [{ "text": "..." }] },
  "tools": [{ "googleSearch": {} }],
  "generationConfig": { "thinkingConfig": { "thinkingLevel": "HIGH" } }
}
```

### Key Headers
- `Content-Type: application/json`
- `X-Goog-Api-Key: <key from .env>`

### Fallback Behavior
- Google Search grounding fails with 500 → automatically falls back to `useSearchTool = false` for remaining retries
- Streaming retries on: 500, 503, UNAVAILABLE, INTERNAL, RESOURCE_EXHAUSTED
- Memory search failure → proceeds without memory context
- PDF upload failure → skips that file, continues with others

---

## 14. Error Handling & Resilience

### Retry Strategy
| Layer | Retries | Delay | Trigger |
|-------|---------|-------|---------|
| `callWithRetry` (generic) | 4 | 1500ms (doubles) | 500, 503, INTERNAL, UNAVAILABLE, RESOURCE_EXHAUSTED, 429 |
| `createRawStream` (inner) | 2 | 1000ms | Same as above |
| Streaming while loop | 3 | 1500ms | Any streaming error |
| Search fallback | 0 (immediate) | — | 500 on search-enabled request |

### Abort Handling
- All pipeline steps check `signal?.aborted` before and during execution
- AbortError is propagated cleanly without retries
- `AbortController` from `ComposerInput` stops mid-stream generation

### Edge Cases
- **No API key:** `isApiKeyConfigured()` returns false, pipeline skips
- **Empty memories:** system role used directly without memory context
- **No memories found:** same as above — model always identifies as Jessie
- **Malformed `<memory_action>` XML:** silently ignored, no save/delete performed
- **Concurrent upload processing:** 2-second polling loop checks File API state (PROCESSING → ACTIVE/FAILED)

---

## 15. Data Storage

| Data | Key (localStorage) | Format |
|------|-------------------|--------|
| Memories | `physica_ai_memories` | `MemoryRecord[]` (JSON) |
| Chat sessions | `physica_ai_chats` | `Chat[]` (JSON) |

All data is client-side only. No backend database or server is used.

---

## 16. Related Documentation

| Document | Description | Path |
|----------|-------------|------|
| Project Overview | Vision, mission, brand, audience | [project.md](./project.md) |
| AI Integration Guide | Non-technical 10-step pipeline explanation | [ai_integration.md](./ai_integration.md) |
| Chat Page Layout | ASCII UI layout of the chat workspace | [chat_page_structure.md](./chat_page_structure.md) |
| Memory Tracker | Full memory system documentation | [memory_tracker.md](./memory_tracker.md) |
| System Role | Jessie's identity and behavior definition | [../src/utils/systemroles/systemroles.ts](../src/utils/systemroles/systemroles.ts) |
| AI Pipeline Code | Main pipeline implementation | [../src/utils/ai/gemini.ts](../src/utils/ai/gemini.ts) |
| Pipeline Utilities | Memory ranking and formatting | [../src/utils/pipeline/pipeline.ts](../src/utils/pipeline/pipeline.ts) |
| Configuration | Constants and thresholds | [../src/utils/ai/config.ts](../src/utils/ai/config.ts) |
| Type Definitions | TypeScript interfaces | [../src/utils/ai/types.ts](../src/utils/ai/types.ts) |
| Seed Data | Initial memory records | [../src/utils/ai/seedData.ts](../src/utils/ai/seedData.ts) |
| Entry Point | React bootstrapping | [../src/main.tsx](../src/main.tsx) |
| Root App | Landing page + chat routing | [../src/App.tsx](../src/App.tsx) |
