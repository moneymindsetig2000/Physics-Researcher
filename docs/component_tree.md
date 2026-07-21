# Physica AI — Component Tree

```
<App>
├── Landing Page (hash !== "#chat")
│   ├── Header
│   ├── Hero
│   ├── Features
│   ├── Comparison
│   ├── WorkspacePreview
│   ├── ResearchSources
│   ├── DesignedForPhysics
│   ├── CTA Section
│   └── Footer
│
└── Chat Page (hash === "#chat")
    ├── Left Sidebar
    │   ├── Search
    │   ├── Library
    │   ├── Saved
    │   ├── History
    │   ├── Papers
    │   ├── Notes
    │   ├── Collections
    │   ├── Recent Sessions
    │   └── DashboardConfirmationModal
    │
    ├── Chat Workspace
    │   ├── WorkspaceHeader
    │   ├── ChatFlowContainer
    │   │   ├── WelcomeState
    │   │   │   └── PromptCardsGrid
    │   │   │
    │   │   └── ConversationFlow
    │   │       ├── MessageItem (user)
    │   │       │   ├── UserMessageWrapper
    │   │       │   │   ├── UserMessageImagesRow
    │   │       │   │   └── UserMessageFilesRow
    │   │       │   ├── MarkdownRenderer
    │   │       │   └── MessageActions (copy, edit)
    │   │       │
    │   │       ├── MessageItem (AI)
    │   │       │   ├── AiMessageGround
    │   │       │   │   ├── ThinkingBox (expandable)
    │   │       │   │   ├── MarkdownRenderer
    │   │       │   │   ├── ArchitectureTraceBlock
    │   │       │   │   └── MessageActions (copy, like, dislike, export PDF)
    │   │       │   └── ConversationDivider
    │   │       │
    │   │       └── ThinkingLoader
    │   │
    │   ├── BlurOverlays (top + bottom)
    │   │
    │   ├── UserPromptScrubber
    │   │
    │   ├── ComposerContainer
    │   │   ├── ComposerInput
    │   │   │   ├── TextArea
    │   │   │   ├── AttachImageButton
    │   │   │   ├── AttachPDFButton
    │   │   │   ├── SendButton
    │   │   │   └── StopButton
    │   │   └── TaggedTextPill
    │   │
    │   ├── ImagePreviewModal (portal)
    │   ├── PDFPreviewModal (portal)
    │   └── SelectionToolbar
    │
    ├── Right Sidebar
    │   └── FileBrowserTab
    │
    └── Settings Panel
```
