import './HeroContent.css';

export function HeroContent() {
  return (
    <>
      <div className="hero-center-content">
        {/* Top Announcement Badge */}
        <div className="hero-badge" id="hero-badge-announcement">
          <span className="badge-new">NEW</span>
          <span className="badge-text">Trained on 10M+ papers</span>
        </div>

        {/* Main Heading */}
        <h1 className="hero-main-title" id="hero-title-main">
          Cognitive intelligence<br />for physics research.
        </h1>

        {/* Bottom Actions */}
        <div className="hero-action-buttons">
          <button className="btn-action-solid" id="btn-action-get-started">
            Get started
          </button>
          <button className="btn-action-glass" id="btn-action-learn-more">
            Learn more
          </button>
        </div>

        {/* Metrics Panel */}
        <section className="hero-metrics" id="metrics-panel" aria-label="Platform Metrics">
          <div className="metric-item">
            <span className="metric-value">10M+</span>
            <span className="metric-label">Papers Indexed</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">Real-time</span>
            <span className="metric-label">Summarization</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">100%</span>
            <span className="metric-label">Grounded Context</span>
          </div>
        </section>
      </div>

      {/* Minimal Footer */}
      <footer className="minimal-footer" id="main-footer">
        <div className="footer-left">
          © 2026 PHYSICA // AI
        </div>
        <div className="footer-center">
          <span className="status-dot" aria-hidden="true" />
          <span className="status-text">Systems Active</span>
        </div>
        <div className="footer-right">
          Physics Research Cognitive Platform
        </div>
      </footer>
    </>
  )
}
