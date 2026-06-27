interface RightPanelHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function RightPanelHeader({ isCollapsed, onToggleCollapse }: RightPanelHeaderProps) {
  return (
    <header className="right-panel-header">
      <button 
        className="panel-collapse-btn" 
        id="btn-collapse-panel" 
        aria-label={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        onClick={onToggleCollapse}
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
            transform: isCollapsed ? 'rotate(180deg) translate3d(0, 0, 0)' : 'translate3d(0, 0, 0)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform'
          }}
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
        <span className="tooltip">{isCollapsed ? 'Expand memory panel to view saved research notes.' : 'Collapse memory panel to maximize main workspace.'}</span>
      </button>
      <div className="panel-title-group">
        <div className="panel-title-icon">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
        <span className="panel-title-text">Memory</span>
      </div>
    </header>
  );
}

