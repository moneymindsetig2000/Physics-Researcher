# Physica AI — Chat Page Structure

This document describes the layout, components, and interaction patterns of the Physica AI chat interface.

---

## Overview

The chat page is organized into three main vertical sections:

```
┌──────────────────┬──────────────────────────────┬──────────────────┐
│   Left Sidebar   │      Main Chat Workspace      │  Right Sidebar   │
│  (Research Exp.) │  (AI Research Workspace)      │  (Global Search) │
└──────────────────┴──────────────────────────────┴──────────────────┘
```

Both sidebars can be collapsed to give more space to the central workspace.

**Routing:** The chat page is served at the `/chat` path using `pushState` + `popstate` (no hash fragments).

---

## Main Chat Workspace

The central workspace is the core of the chat experience. It contains the following components, stacked vertically:

### Workspace Header

- Displays the title **"Physica AI"** and a subtitle/description.
- Contains buttons to toggle the left and right sidebars.
- Fixed height of **80px** with a subtle bottom border.
- Z-index: `3`

### Chat Flow Container

The scrollable middle section that fills the remaining vertical space (`flex: 1`). It has a maximum width of **900px** and is centered horizontally.

#### Welcome State (No Messages)

When there are no messages in the active chat, a centered welcome state is shown containing:

- A logo SVG icon
- Title and description text
- **Prompt Cards Grid** — A set of prompt suggestion cards for Masters-level physics research. Each card is clickable and sends the prompt as a new message. Prompts cover topics like:
  - Topological phases in condensed matter
  - Quantum error correction codes
  - Holographic entanglement entropy
  - Nonequilibrium statistical mechanics
  - Renormalization group methods
  - Quantum many-body localization
  - Spontaneous symmetry breaking

#### Conversation Flow (Active Chat)

When messages exist, the conversation is displayed as a scrollable list inside `.conversation-flow`.

**Message Items** (`MessageItem` — `ChatWorkspace.tsx`):

Each message is rendered as a `.message-row` with a `data-message-id` attribute used for programmatic scrolling.

- **User Messages (`.user-row`):**
  - Rendered inside `.user-message-wrapper`
  - Supports attached images (rendered in `.user-message-images-row`) — clickable for fullscreen preview
  - Supports attached PDFs (rendered in `.user-message-files-row`) — clickable to download
  - Text content rendered via `MarkdownRenderer`
  - **Message Actions (`.message-actions`, right-aligned):**
    - **Copy** — Copies the message text to clipboard (icon switches to checkmark on success)
    - **Edit** — Pencil icon for editing the message

- **AI Messages (`.ai-row`):**
  - Rendered inside `.ai-message-ground`
  - **Thinking Process Box (`.ai-thinking-box`):** If the AI response includes a `thought` field, an expandable thinking section is shown. It has:
    - A header labeled "Thinking Process" with a collapse/expand toggle button
    - Smooth scroll-to-bottom behavior as new thinking content streams in
    - Uses framer-motion for entry animation
  - Main text content rendered via `MarkdownRenderer`
  - Fallback `ThinkingLoader` shown when neither text nor thought exists
  - **Architecture Trace Block:** If a `trace` record is present, it is rendered at the bottom of the AI message
  - **Message Actions (`.message-actions`, left-aligned):**
    - **Copy** — Copies the message text to clipboard
    - **Like** — Thumbs up toggle (filled when active)
    - **Dislike** — Thumbs down toggle (filled when active)
    - **Export PDF** — Generates an A4 PDF of the AI message using html2canvas + jsPDF, preserving markdown formatting and KaTeX equations with consistent 18mm margins on every page
  - All action icons are pure SVGs with smooth CSS transitions (color, background, scale) and a 0.9× squash on click

#### Blur Overlays

Two fixed blur overlays sit at the top and bottom edges of the chat flow container (`workspace-blur-overlay-top` and `workspace-blur-overlay-bottom`) to create a depth effect when the content scrolls beneath them.

#### Composer Container

Fixed at the bottom of the chat flow container with `position: absolute; bottom: 0`. Contains:

- **Composer Input (`ComposerInput`):**
  - A text input for typing prompts
  - Support for attaching images (via file picker or paste)
  - Support for attaching PDFs
  - Send button
  - Stop generation button (visible during AI response streaming)

### Prompt Scrubber

A vertical navigation strip positioned at the **far right edge** of the workspace (`position: absolute; right: 0; z-index: 10`), spanning from below the header (`top: 80px`) to above the footer (`bottom: 24px`).

**Visual Design:**
- Thin white capsules (20px × 5px, 3px border-radius, 0.7 opacity, full white on hover)
- One capsule per user message, evenly spaced with 4px gaps
- Capsules are centered vertically when few messages exist; scroll smoothly when they overflow the container height
- The capsule container uses `::before`/`::after` pseudo-elements with `flex: 1` to maintain vertical centering while supporting overflow scrolling

**Interaction:**
- **Hover** over any capsule (or gaps between them) → an Apple-style popup appears
- The popup lists all user prompts in order, each on its own line
- **Popup styling:** Glassmorphism background (`rgba(22, 22, 26, 0.85)`), `backdrop-filter: blur(24px) saturate(1.4)`, 0.5px border, 10px border radius, San Francisco font stack, 13px font size
- The popup has a `max-height` of `min(360px, 60vh)` — limits to approximately 7-8 prompts before smooth scrolling activates (thin 4px scrollbar)
- **Click** any prompt line → smooth-scrolls (`scrollIntoView` with `block: 'center'`) to that message in the conversation
- Popup closes with a 100ms delay after mouse leaves to prevent flickering
- Animated with framer-motion (fade + scale with Apple cubic-bezier `[0.16, 1, 0.3, 1]`)

**Implementation files:**
- `src/components/chatpage/chat/ui/UserPromptScrubber.tsx`
- `src/components/chatpage/chat/ui/UserPromptScrubber.css`

### Workspace Footer

A thin footer bar (24px height) at the bottom showing the disclaimer:

> "Physica-AI can make mistakes. Check important info."

Z-index: `3`

### Image Preview Modal

When a user clicks an attached image, a fullscreen image preview modal is rendered via React portal to `document.body`. Clicking the overlay or the close button dismisses it.

---

## Left Sidebar (Research Explorer)

The left sidebar provides research exploration tools:

- **Search** — Search across notes and papers
- **Library** — Saved research library
- **Saved** — Bookmarked items
- **History** — Chat history
- **Papers** — Research papers
- **Notes** — Personal notes
- **Collections** — Organized collections
- **Recent Sessions** — List of recent chat sessions

### Dashboard Navigation

The sidebar includes a **"Go to Dashboard"** button that triggers a confirmation modal (`DashboardConfirmationModal`):

- A glassmorphic modal asking the user to confirm navigation to the dashboard
- Confirming closes the chat and redirects to the root path
- Cancel dismisses the modal

---

## Right Sidebar (Global Search)

The right sidebar provides global research search functionality. Both left and right sidebars can be independently collapsed using toggle buttons in the workspace header.

---

## Prompt Cards Grid

Located on the welcome state, the `PromptCardsGrid` displays physics research prompts as interactive cards. Each card:

- Shows a prompt title and description
- Is clickable to immediately send the prompt and start a conversation
- Uses glassmorphic styling consistent with the rest of the UI
- **Routing note:** All "Get Started" and CTA buttons across the app (landing page hero, header, CTA sections) now route to `/chat` instead of `/#chat`

---

## Key CSS Architecture

| Component | Stylesheet | Notable Properties |
|-----------|-----------|-------------------|
| Workspace | `ChatWorkspace.css` | `flex: 1`, `height: 100%`, `position: relative` |
| Chat Flow | `ChatWorkspace.css` | `max-width: 900px`, `margin: 0 auto`, `overflow: hidden`, `contain: layout` |
| Conversation Flow | `ChatWorkspace.css` | Scrollable message list |
| Composer | `ChatWorkspace.css` | `position: absolute; bottom: 0`, `max-width: 840px`, `z-index: 3` |
| Sidebar | `Sidebar.css` | Collapsible panel |
| Scrubber | `UserPromptScrubber.css` | `position: absolute; right: 0`, flex centering with scroll |
| Dashboard Modal | `DashboardConfirmationModal.css` | Glassmorphism overlay |

---

## Related Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root routing setup (`/chat` path) |
| `src/components/chatpage/ChatPage.tsx` | Chat page container with sidebars |
| `src/components/chatpage/chat/ChatWorkspace.tsx` | Main workspace component |
| `src/components/chatpage/chat/ChatWorkspace.css` | Workspace styles |
| `src/components/chatpage/chat/ui/WorkspaceHeader.tsx` | Header component |
| `src/components/chatpage/chat/ui/WorkspaceFooter.tsx` | Footer component |
| `src/components/chatpage/chat/ui/WelcomeState.tsx` | Welcome state |
| `src/components/chatpage/chat/ui/PromptCardsGrid.tsx` | Physics prompt cards |
| `src/components/chatpage/chat/ui/ComposerInput.tsx` | Message composer |
| `src/components/chatpage/chat/ui/ThinkingLoader.tsx` | Loading indicator |
| `src/components/chatpage/chat/ui/UserPromptScrubber.tsx` | Prompt navigation scrubber |
| `src/components/chatpage/chat/ui/UserPromptScrubber.css` | Scrubber styles |
| `src/components/chatpage/chat/ui/MessageActions.tsx` | Copy, edit, like, dislike buttons |
| `src/components/chatpage/chat/ui/MessageActions.css` | Message action styles |
| `src/components/chatpage/chat/ui/ConversationDivider.tsx` | Thin separator between conversation rounds |
| `src/components/chatpage/chat/ui/ConversationDivider.css` | Divider styles |
| `src/components/chatpage/chat/ui/ArchitectureTraceBlock.tsx` | Pipeline diagnostics |
| `src/components/chatpage/chat/ui/markdowns/MarkdownRenderer.tsx` | Markdown rendering |
| `src/components/chatpage/sidebar/Sidebar.tsx` | Left sidebar |
| `src/components/chatpage/sidebar/Sidebar.css` | Sidebar styles |
| `src/components/chatpage/sidebar/options/DashboardConfirmationModal.tsx` | Dashboard confirmation modal |
| `src/components/chatpage/sidebar/options/DashboardConfirmationModal.css` | Modal styles |
| `src/utils/pdf/exportPdf.ts` | PDF export utility — renders AI messages to A4 PDF via html2canvas + jsPDF |
