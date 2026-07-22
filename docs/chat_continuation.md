# Physica AI — Chat Continuation System

## Overview

The chat continuation system manages transitions between chat sessions, allowing the user to either carry forward context from a previous session or start completely fresh. It preserves research continuity while giving the user full control over context propagation.

## New Chat Dialog

When the user clicks **"New Chat"** while an active chat with messages exists, a modal dialog appears offering two choices instead of immediately creating an empty chat.

### Visual Design

- Full-screen dimmed overlay (`rgba(5, 5, 8, 0.88)`)
- Centered modal (400px wide, `#121216` background, 16px radius, 0.5px border)
- Title: "New Research Session" with a subtitle asking about context carry-forward
- Two glass-styled option cards side by side:
  - **Continue with Context** — layers icon, primary styling
  - **Fresh Start** — plus icon, secondary styling
- Entry/exit animated with framer-motion (scale + fade, Apple cubic-bezier)

### Interaction

| Action | Behavior |
|--------|----------|
| **Continue with Context** | Creates a new chat. The previous chat's `summary` is stored in `pendingContextSummaryRef` and passed to the new chat's context so the AI can reference prior research continuity |
| **Fresh Start** | Creates a completely empty new chat. `pendingContextSummaryRef` is set to null — no prior context is passed |
| **Dismiss** (overlay click / close) | Dialog closes without action |

### Context Propagation Flow

```
User clicks "New Chat"
        │
        ├─ Active chat has messages? → Show NewChatDialog
        │       │
        │       ├─ "Continue with Context" →
        │       │       pendingContextSummaryRef = activeChat.summary
        │       │       new chat created → summary injected into system prompt
        │       │
        │       └─ "Fresh Start" →
        │               pendingContextSummaryRef = null
        │               new chat created with no prior context
        │
        └─ Active chat has no messages? → Create empty chat immediately (no dialog)
```

The `pendingContextSummaryRef` is consumed during the next message send: when the user sends their first message in the new chat, if a pending summary exists, it's included in the system instruction as background context.

## Relationship with Summary System

The chat continuation feature depends on the research summary system (`docs/summary_system.md`):

- **Without summary:** "Continue with Context" still works but provides minimal continuity value
- **With summary:** The structured summary (Goal, Progress, Key Decisions, etc.) is injected as context, allowing the AI to understand prior research state without needing the full conversation history

## Files

| File | Purpose |
|------|---------|
| `src/components/chatpage/chat/ui/NewChatDialog.tsx` | Modal dialog component |
| `src/components/chatpage/chat/ui/NewChatDialog.css` | Dialog styles |
| `src/utils/ai/summaryGenerator.ts` | Generates the summary used for context propagation |
| `src/utils/systemroles/summarySystemRole.ts` | System role for the summary model |
