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
    │   │
    │   ├── SummaryPopup (modal)
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

    └── NewChatDialog (modal, portal)
```
