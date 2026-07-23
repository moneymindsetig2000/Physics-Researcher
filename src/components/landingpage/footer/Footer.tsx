import "./Footer.css";

export function Footer() {
  const handleScrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const scrollContainer = document.querySelector('.scroll-content-flow');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="footer-section" id="footer">
      <div className="footer-container">
        
        {/* Main Footer Content Grid */}
        <div className="footer-grid">
          
          {/* Brand Profile Column */}
          <div className="footer-brand-col">
            <div className="footer-logo" id="footer-logo-brand">
              <svg className="footer-logo-svg" viewBox="0 0 100 100" width="26" height="26" aria-hidden="true">
                <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(30, 50, 50)" />
                <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(90, 50, 50)" />
                <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(150, 50, 50)" />
                <circle cx="50" cy="50" r="7" fill="currentColor" />
              </svg>
              <span className="footer-logo-text">Physica-AI</span>
            </div>
            <h3 className="footer-brand-tagline">The Research Partner Built For Physics.</h3>
            <p className="footer-brand-description">
              Helping researchers discover, understand, and explore scientific literature through intelligent research assistance and knowledge exploration.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links">
              <li>
                <a href="#features" onClick={(e) => handleScrollToSection(e, "features")} id="footer-link-features">
                  • Features
                </a>
              </li>
              <li>
                <a href="#workspace-preview" onClick={(e) => handleScrollToSection(e, "workspace-preview")} id="footer-link-workflow">
                  • Research Workflow
                </a>
              </li>
              <li>
                <a href="#research-sources" onClick={(e) => handleScrollToSection(e, "research-sources")} id="footer-link-sources">
                  • Research Sources
                </a>
              </li>
              <li>
                <a href="#designed-for-physics" onClick={(e) => handleScrollToSection(e, "designed-for-physics")} id="footer-link-physics">
                  • Physics Research
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <ul className="footer-links">
              <li>
                <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" id="footer-link-arxiv">
                  • arXiv
                </a>
              </li>
              <li>
                <a href="https://inspirehep.net" target="_blank" rel="noopener noreferrer" id="footer-link-inspire">
                  • INSPIRE
                </a>
              </li>
              <li>
                <a href="https://ui.adsabs.harvard.edu" target="_blank" rel="noopener noreferrer" id="footer-link-nasa">
                  • NASA ADS
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} id="footer-link-open-access">
                  • Open Access Research
                </a>
              </li>
            </ul>
          </div>

          {/* Core Capabilities Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Core Capabilities</h4>
            <ul className="footer-items-list">
              <li>• Research Discovery</li>
              <li>• Paper Understanding</li>
              <li>• Literature Exploration</li>
              <li>• Citation Analysis</li>
              <li>• Equation Explanation</li>
              <li>• Research Insights</li>
            </ul>
          </div>

          {/* Built For Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Built For</h4>
            <ul className="footer-items-list">
              <li>• Researchers</li>
              <li>• Professors</li>
              <li>• PhD Students</li>
              <li>• Masters Students</li>
              <li>• Research Groups</li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <span className="footer-copyright" id="footer-copyright-text">
              © 2026 Physica AI · For Radha
            </span>
            <span className="footer-mission" id="footer-mission-text">
              Designed to make scientific knowledge more accessible, understandable, and discoverable.
            </span>
            <a href="#" onClick={handleScrollToTop} className="footer-back-to-top" id="footer-back-to-top">
              Back to Top ↑
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
