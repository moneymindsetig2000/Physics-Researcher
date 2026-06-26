export function WorkspaceHeader() {
  return (
    <header className="workspace-header" id="chat-header">
      <div className="header-text-group">
        <h1 className="workspace-title">Chat with Command R+</h1>
        <p className="workspace-desc">A conversational tool for web searches, citing sources, research, drafting, debugging, and more.</p>
      </div>
      <div className="header-actions">
        {/* GitHub Icon */}
        <button className="icon-btn" id="btn-github" aria-label="GitHub Repository">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </button>
        {/* Panels Icon */}
        <button className="icon-btn" id="btn-panels" aria-label="Toggle Panels">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
      </div>
    </header>
  );
}
