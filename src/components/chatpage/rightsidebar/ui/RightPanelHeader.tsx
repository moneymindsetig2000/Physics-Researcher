export function RightPanelHeader() {
  return (
    <header className="right-panel-header">
      <button className="panel-collapse-btn" id="btn-collapse-panel" aria-label="Collapse Panel">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
      <div className="panel-title-group">
        <div className="panel-title-icon">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <span className="panel-title-text">Tools</span>
      </div>
    </header>
  );
}
