interface BrandHeaderProps {
  onToggleCollapse: () => void;
}

export function BrandHeader({ onToggleCollapse }: BrandHeaderProps) {
  return (
    <div className="brand-header" id="sidebar-brand" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <svg className="brand-icon-svg logo-svg" viewBox="0 0 100 100" width="22" height="22" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(90, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(150, 50, 50)" />
        <circle cx="50" cy="50" r="7" fill="currentColor" />
      </svg>
      <span className="brand-title">Physica-AI</span>
      <button 
        className="panel-collapse-btn" 
        id="btn-collapse-sidebar" 
        aria-label="Collapse Sidebar" 
        style={{ marginLeft: 'auto' }}
        onClick={onToggleCollapse}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span className="tooltip">Collapse navigation sidebar to maximize main workspace.</span>
      </button>
    </div>
  );
}
