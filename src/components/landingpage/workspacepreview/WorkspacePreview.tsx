"use client";

import "./WorkspacePreview.css";

const workflowSteps: { title: string; desc: string }[] = [
  { title: "Search", desc: "Research topics" },
  { title: "Discover", desc: "Relevant papers" },
  { title: "Open Paper", desc: "Reader view" },
  { title: "AI Summary", desc: "Key insights" },
  { title: "Findings", desc: "Core results" },
  { title: "Equations", desc: "Math breakdown" },
  { title: "Citations", desc: "Related work" },
  { title: "Insights", desc: "Save notes" },
];

export function WorkspacePreview() {
  return (
    <section className="preview-section" id="workspace-preview">
      <div className="preview-container">
        <h2 className="preview-section-title">Research Workspace Preview</h2>
        <p className="preview-section-subtitle">
          A unified research environment designed specifically for physics researchers. Explore the workflow and features below.
        </p>

        <div className="preview-layout-grid">
          <div className="border-glow-card">
            <div className="edge-light" />
                <div className="border-glow-inner preview-left-inner">
              <div className="workflow-sidebar">
                <div className="workflow-steps-list">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className="workflow-step-card">
                      <div className="step-number-dot">
                        <span>{index + 1}</span>
                      </div>
                      <div className="step-card-text">
                        <h4 className="step-title-text">{step.title}</h4>
                        <p className="step-desc-text">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-glow-card">
            <div className="edge-light" />
            <div className="border-glow-inner">
              <div className="preview-mockup">
                <div className="mockup-workspace-body">
                  <div className="panel-container search-panel">
                    <div className="panel-header">Research Search Panel</div>
                    <div className="search-bar-mock">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span className="search-query-text">
                        quantum Hall effect in graphene bilayer lattice structures at low temperature
                      </span>
                      <div className="search-badge-stub">Physics Core</div>
                    </div>
                  </div>

                  <div className="preview-columns-area">
                    <div className="panel-container discovery-panel">
                      <div className="panel-header">Paper Discovery Results</div>
                      <div className="discovery-items-stack">
                        <div className="discovery-item active">
                          <div className="item-title">Observation of anomalous quantum Hall effect</div>
                          <div className="item-meta">Y. Zhang, et al. • Citations: 12,402 • Match: 98%</div>
                        </div>
                        <div className="discovery-item">
                          <div className="item-title">Experimental realization of graphene bilayers</div>
                          <div className="item-meta">K. Novoselov, et al. • Citations: 8,924 • Match: 91%</div>
                        </div>
                        <div className="discovery-item">
                          <div className="item-title">Lattice dynamics and electron-phonon interactions</div>
                          <div className="item-meta">M. S. Dresselhaus • Citations: 4,115 • Match: 84%</div>
                        </div>
                      </div>
                    </div>

                    <div className="panel-container viewer-panel flex-2">
                      <div className="panel-header">Research Paper Viewer</div>
                      <div className="paper-viewer-content">
                        <h1 className="paper-headline">Anomalous Hall Conductivity in Layered Lattice Bilayers</h1>
                        <p className="paper-abstract">
                          We present a detailed experimental study of the electronic properties of graphene lattices under high magnetic fields. We observe quantized Hall conductivity corresponding to...
                        </p>
                        <div className="math-equation-block">
                          <span className="equation-math">σ_xy = ν · (e² / h)</span>
                        </div>
                        <p className="paper-body-paragraph">
                          The observed quantization is robust against thermal excitations up to T = 4.2 K, validating lattice stability models.
                        </p>
                      </div>
                    </div>

                    <div className="preview-sidebar-panels">
                      <div className="panel-container summary-panel">
                        <div className="panel-header">AI Companion & Findings</div>
                        <div className="ai-companion-content">
                          <div className="ai-section-title">Key Findings</div>
                          <ul className="ai-bullets-list">
                            <li>Discovered anomalous Hall conductivity states at 4.2 K.</li>
                            <li>Validated fractional lattices under robust field configurations.</li>
                            <li>Proved topological invariant protections inside bilayer graphene.</li>
                          </ul>
                        </div>
                      </div>

                      <div className="panel-container citations-panel">
                        <div className="panel-header">Citation Explorer</div>
                        <div className="citations-links-stack">
                          <div className="citation-link">
                            <span className="link-arrow">↗</span>
                            <span className="link-title">Novoselov et al. (Nature 2005)</span>
                          </div>
                          <div className="citation-link">
                            <span className="link-arrow">↗</span>
                            <span className="link-title">Haldane (PRL 1988 - Anomalous Hall)</span>
                          </div>
                        </div>
                      </div>

                      <div className="panel-container notes-panel">
                        <div className="panel-header">Research Notes & Insights</div>
                        <div className="notes-editor-stub">
                          <div className="notes-bullet-draft">
                            Drafting: BILAYER STABILITY REPORT
                          </div>
                          <p className="notes-content-draft">
                            The 4.2 K anomalous quantum Hall state observed by Zhang matches the topological lattice prediction...
                          </p>
                          <div className="ai-insight-generation-alert">
                            ⚡ AI insight generated: Lattice symmetry limits thermal drift.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mockup-status-footer">
                  <div className="status-indicator">
                    <span className="green-pulsing-dot" />
                    <span>Connected to ArXiv, INSPIRE, and NASA ADS</span>
                  </div>
                  <div className="corpus-badge">10M+ Physics Documents Indexed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
