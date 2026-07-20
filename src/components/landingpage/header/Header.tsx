import './Header.css';

export function Header() {
  const handleSignUp = () => {
    window.history.pushState({}, '', '/chat');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header className="floating-header" id="main-header">
      <div className="header-inner">
        {/* Logo Brand Group */}
        <div className="brand-logo" id="logo-brand">
          <svg className="logo-svg" viewBox="0 0 100 100" width="22" height="22" aria-hidden="true">
            <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(30, 50, 50)" />
            <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(90, 50, 50)" />
            <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(150, 50, 50)" />
            <circle cx="50" cy="50" r="7" fill="currentColor" />
          </svg>
          <span className="logo-text">Physica-AI</span>
        </div>

        {/* Navigation Items */}
        <nav className="minimal-nav" aria-label="Main Navigation">
          <ul className="nav-links-list">
            <li><a href="#features" className="nav-item-link" id="link-features">Features</a></li>
            <li><a href="#about" className="nav-item-link" id="link-about">About</a></li>
          </ul>
        </nav>

        {/* CTA Action */}
        <div className="action-button-group">
          <button className="btn-request" id="btn-header-access" onClick={handleSignUp}>
            Sign up
          </button>
        </div>
      </div>
    </header>
  )
}
