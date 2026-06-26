export function BrandHeader() {
  return (
    <div className="brand-header" id="sidebar-brand">
      <div className="brand-icon-wrapper">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="brand-icon-svg">
          <path d="m12 3-1.912 5.886L4.2 9l5.886 1.912L12 16.8l1.912-5.888L19.8 9l-5.886-1.914Z" fill="currentColor" stroke="none" />
          <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
        </svg>
      </div>
      <span className="brand-title">Supernova</span>
    </div>
  );
}
