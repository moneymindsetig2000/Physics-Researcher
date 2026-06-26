export function BrandHeader() {
  return (
    <div className="brand-header" id="sidebar-brand">
      <svg className="brand-icon-svg logo-svg" viewBox="0 0 100 100" width="22" height="22" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(90, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(150, 50, 50)" />
        <circle cx="50" cy="50" r="7" fill="currentColor" />
      </svg>
      <span className="brand-title">Physica-AI</span>
    </div>
  );
}
