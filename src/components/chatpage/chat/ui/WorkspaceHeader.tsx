interface WorkspaceHeaderProps {
  isRightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  isLeftSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
}

export function WorkspaceHeader({ 
  isRightSidebarCollapsed, 
  onToggleRightSidebar,
  isLeftSidebarCollapsed,
  onToggleLeftSidebar
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header" id="chat-header">
      <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isLeftSidebarCollapsed && (
          <button 
            className="icon-btn panel-collapse-btn" 
            id="btn-toggle-left-sidebar" 
            aria-label="Expand Sidebar"
            onClick={onToggleLeftSidebar}
            style={{
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '0.25rem'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="18" 
              height="18" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="tooltip">Expand navigation sidebar to access dashboard and configurations.</span>
          </button>
        )}
        <div className="header-text-group">
          <h1 className="workspace-title">Chat with Gemma 4 31B</h1>
          <p className="workspace-desc">A specialized companion for physics paper discovery, literature review, and equation understanding.</p>
        </div>
      </div>
      <div className="header-actions">
        {/* GitHub Icon */}
        <button className="icon-btn" id="btn-github" aria-label="GitHub Repository">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span className="tooltip">Visit repository source code and academic integration configs.</span>
        </button>
        {/* Panels Icon */}
        <button className="icon-btn" id="btn-panels" aria-label="Toggle Panels">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span className="tooltip">Configure workspace window splits and panel layouts.</span>
        </button>
        {/* Right Sidebar Collapse/Expand Button */}
        {isRightSidebarCollapsed && (
          <button 
            className="icon-btn panel-collapse-btn" 
            id="btn-toggle-right-sidebar" 
            aria-label="Expand Sidebar"
            onClick={onToggleRightSidebar}
            style={{
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="18" 
              height="18" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transform: 'rotate(180deg) translate3d(0,0,0)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform'
              }}
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="tooltip">Expand right-hand panel to view saved research notes.</span>
          </button>
        )}
      </div>
    </header>
  );
}

