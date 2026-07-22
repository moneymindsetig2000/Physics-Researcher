# Physica AI — Research Summary System

## Overview

The summary system generates structured research summaries of chat conversations to provide long-term continuity across sessions. It uses a dedicated AI call (separate from the main chat model) to produce a consistent, state-oriented summary in a physics-research format.

## Architecture

```
User clicks Summary button in header
        │
        ▼
ChatWorkspace calls generateSummary()
        │
        ├─ Constructs conversation text from all messages
        ├─ Passes existing summary (if any) for incremental merge
        ├─ Calls Gemini 2.0 Flash via callWithRetry()
        │   ├─ Model: gemini-2.0-flash-001 (low-temp: 0.3)
        │   ├─ System role: SUMMARY_SYSTEM_ROLE
        │   └─ Thinking config: HIGH
        │
        └─ Returns structured markdown summary or null on failure
                │
                ▼
        SummaryPopup displays the result in a modal overlay
```

## Components

### SummaryPopup (`src/components/chatpage/chat/ui/SummaryPopup.tsx`)

A full-screen overlay modal rendered via `createPortal` to `document.body`.

- Triggered by the document-icon button in `WorkspaceHeader`
- Entry animation: fade + scale (0.15s–0.2s, Apple cubic-bezier)
- Displays the summary as rendered markdown via `MarkdownRenderer`
- Shows an empty-state message when no summary exists
- Dismissable via overlay click or close button

### Summary Generator (`src/utils/ai/summaryGenerator.ts`)

Core async function `generateSummary()` that:

- Converts messages to `[Researcher]/[Assistant]` labeled text
- Supports **incremental merging**: if an `existingSummary` is provided, it constructs a prompt that merges new exchanges into the existing summary rather than regenerating from scratch
- Uses `callWithRetry` with 2 retries and 1000ms base delay
- AbortSignal support for cancellation

### Summary System Role (`src/utils/systemroles/summarySystemRole.ts`)

A comprehensive system role defining the summary AI's behavior:

**Purpose:** Produce a structured, state-oriented summary (not a transcript). Focus on what the user is doing, what's been accomplished, what's blocked, and what should happen next.

**Required output sections:**
- Goal — overarching objective
- Constraints & Preferences — important limitations and user preferences
- Progress (Done, In Progress, Blocked) — current state of work
- Key Decisions — important decisions with reasoning
- Next Steps — logical future actions
- Critical Context — information essential for continuity
- Relevant Files & Resources — files, tools, documents

**Behavioral rules:**
- Incrementally update existing summaries (don't discard valid info)
- Never invent information, decisions, or progress
- Preserve uncertainty when present
- Distinguish between confirmed facts, proposed ideas, and unresolved issues
- Optimize for future usefulness (Jessie's continuity), not literary quality

## Data Flow

```
Chat continues → messages accumulate
        │
        ▼
User clicks Summary button
        │
        ▼
generateSummary(messages, existingSummary?)
        │
        ├─ First call: creates new summary from all messages
        ├─ Subsequent calls: merges new exchanges into existing summary
        │
        ▼
Summary displayed in SummaryPopup modal
        │
        ▼
Summary stored on Chat.summary field → passed to new chats via NewChatDialog's "Continue with Context"
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate AI call (not part of main chat) | Keeps main chat fast; summary generation is optional and can use a cheaper/faster model |
| Incremental merge | Avoids regenerating full summary each time; preserves valid existing content |
| Low temperature (0.3) + High thinking | Ensures consistent structured output while allowing thoughtful extraction |
| State-oriented, not transcript | The summary captures "what is true now" rather than "what was said" — more useful for continuity |

## Files

| File | Purpose |
|------|---------|
| `src/components/chatpage/chat/ui/SummaryPopup.tsx` | Modal UI for viewing the summary |
| `src/components/chatpage/chat/ui/SummaryPopup.css` | Summary popup styles |
| `src/utils/ai/summaryGenerator.ts` | Core summary generation logic |
| `src/utils/systemroles/summarySystemRole.ts` | System role defining summary format and behavior |
