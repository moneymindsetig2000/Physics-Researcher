// Radha
interface WorkspaceHeaderProps { // Radha
  isRightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  isLeftSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  onSummaryClick?: () => void;
  hasMessages?: boolean;
  isSummaryGenerating?: boolean;
}

export function WorkspaceHeader({ 
  isRightSidebarCollapsed, 
  onToggleRightSidebar,
  isLeftSidebarCollapsed,
  onToggleLeftSidebar,
  onSummaryClick,
  hasMessages,
  isSummaryGenerating
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
          <h1 className="workspace-title">Jessie</h1>
          <p className="workspace-desc">A specialized companion for physics paper discovery, literature review, and equation understanding.</p>
        </div>
      </div>
      <div className="header-actions">
        {/* Research Summary Button */}
        <button 
          className="icon-btn" 
          id="btn-summary" 
          aria-label="Research Summary"
          onClick={onSummaryClick}
          style={{ opacity: (hasMessages && !isSummaryGenerating) ? 1 : (isSummaryGenerating ? 1 : 0.3), pointerEvents: hasMessages ? 'auto' : 'none' }}
        >
          {isSummaryGenerating ? (
            <svg className="summary-spinner" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" strokeDasharray="50" strokeDashoffset="50">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" values="50;0;50" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          )}
          <span className="tooltip">{isSummaryGenerating ? 'Generating research summary...' : 'View research session summary and progress.'}</span>
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

