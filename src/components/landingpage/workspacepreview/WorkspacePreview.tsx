"use client";

import { useState, useEffect, useRef } from "react";
import "./WorkspacePreview.css";

interface WorkflowStep {
  title: string;
  description: string;
  targetPanel: string;
}

export function WorkspacePreview() {
  const [activeStep, setActiveStep] = useState<number>(-1); // Starts at -1 (completely hidden)
  const sectionRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef<boolean>(false);
  const offsetTopRef = useRef<number>(0);
  const sectionHeightRef = useRef<number>(0);

  const workflowSteps: WorkflowStep[] = [
    {
      title: "Search Research Topic",
      description: "Query global repositories using natural language semantic search.",
      targetPanel: "search-panel",
    },
    {
      title: "Discover Relevant Papers",
      description: "Auto-filter results based on relevance score, citation count, and publish dates.",
      targetPanel: "discovery-panel",
    },
    {
      title: "Open Research Paper",
      description: "Load papers into the built-in clean, math-friendly reader view.",
      targetPanel: "viewer-panel",
    },
    {
      title: "Generate AI Summary",
      description: "Instant semantic analysis to extract critical findings, hypotheses, and scope.",
      targetPanel: "summary-panel",
    },
    {
      title: "Explore Key Findings",
      description: "Isolate primary scientific claims, experiments, and methodology parameters.",
      targetPanel: "findings-panel",
    },
    {
      title: "Understand Equations",
      description: "Hover over complex physical symbols and terms to get plain-English breakdowns.",
      targetPanel: "equation-panel",
    },
    {
      title: "View Citations & Related Work",
      description: "Explore the publication graph and browse highly similar papers in parallel.",
      targetPanel: "citations-panel",
    },
    {
      title: "Generate Research Insights",
      description: "Save notes, compile evidence, and write AI-guided insights directly into drafts.",
      targetPanel: "notes-panel",
    },
  ];

  useEffect(() => {
    if (!sectionRef.current) return;
    const scrollContainer = sectionRef.current.parentElement;
    if (!scrollContainer) return;

    const updateDimensions = () => {
      if (!sectionRef.current || !scrollContainer) return;
      
      // Calculate offsetTop relative to the scroll container
      let top = 0;
      let curr: HTMLElement | null = sectionRef.current;
      while (curr && curr !== scrollContainer) {
        top += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      
      offsetTopRef.current = top;
      sectionHeightRef.current = sectionRef.current.offsetHeight;
    };

    updateDimensions();

    const handleScroll = () => {
      if (!scrollContainer) return;

      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const scrollTop = scrollContainer.scrollTop;
          const viewportHeight = window.innerHeight;
          const totalHeight = sectionHeightRef.current || viewportHeight * 3.8;
          const offsetTop = offsetTopRef.current;

          // Start tracking progress when the top of the section reaches 10% of viewport height
          const startOffset = viewportHeight * 0.1;
          const scrolled = scrollTop - offsetTop + startOffset;
          const totalScrollable = totalHeight - viewportHeight;

          if (scrolled >= 0 && scrolled <= totalScrollable) {
            const progress = scrolled / totalScrollable;
            // Map the 0.15 to 0.85 progress range to the 8 steps
            if (progress < 0.15) {
              setActiveStep(prev => (prev !== -1 ? -1 : prev));
            } else if (progress > 0.85) {
              const maxStep = workflowSteps.length - 1;
              setActiveStep(prev => (prev !== maxStep ? maxStep : prev));
            } else {
              const adjustedProgress = (progress - 0.15) / 0.7;
              const step = Math.min(
                Math.floor(adjustedProgress * workflowSteps.length),
                workflowSteps.length - 1
              );
              setActiveStep(prev => (prev !== step ? step : prev));
            }
          } else if (scrolled < 0) {
            setActiveStep(prev => (prev !== -1 ? -1 : prev));
          } else {
            const maxStep = workflowSteps.length - 1;
            setActiveStep(prev => (prev !== maxStep ? maxStep : prev));
          }

          tickingRef.current = false;
        });

        tickingRef.current = true;
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateDimensions);
    // Run once on mount to capture initial position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [workflowSteps.length]);

  const handleStepClick = (index: number) => {
    if (!sectionRef.current) return;
    const scrollContainer = sectionRef.current.parentElement;
    if (!scrollContainer) return;

    const offsetTop = offsetTopRef.current;
    const trackHeight = sectionHeightRef.current || window.innerHeight * 2.5;
    const viewportHeight = window.innerHeight;
    const totalScrollable = trackHeight - viewportHeight;

    // Calculate target scroll scroll-point to trigger this specific step within the 0.15 - 0.85 range
    const targetProgress = 0.15 + (index / (workflowSteps.length - 0.5)) * 0.7;
    const targetScroll = offsetTop - (viewportHeight * 0.1) + targetProgress * totalScrollable;

    scrollContainer.scrollTo({
      top: targetScroll,
      behavior: "smooth"
    });
  };

  return (
    <section className="workspace-preview-section" id="workspace-preview" ref={sectionRef}>
      <div className="workspace-preview-container">
        {/* Header Block */}
        <div className="workspace-header">
          <h2 className="workspace-title">Research Workspace Preview</h2>
          <p className="workspace-subtitle">
            A unified research environment designed specifically for physics researchers. Scroll through the section to see the workflow and dashboard build up.
          </p>
          <div className="workspace-hint-capsule">
            <svg className="hint-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>Scroll down to see live workflow</span>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="workspace-layout-grid">
          {/* Left Column: Workflow Steps */}
          <div className="workflow-sidebar">
            <h3 className="sidebar-title">Research Workflow</h3>
            <div className="workflow-steps-list">
              {workflowSteps.map((step, index) => (
                <div
                  key={index}
                  className={`workflow-step-card ${
                    activeStep >= index ? "revealed" : "hidden-step"
                  } ${activeStep === index ? "active" : ""}`}
                  onClick={() => handleStepClick(index)}
                >
                  <div className="step-number-dot">
                    <span>{index + 1}</span>
                  </div>
                  <div className="step-card-text">
                    <h4 className="step-title-text">{step.title}</h4>
                    <p className="step-desc-text">{step.description}</p>
                  </div>
                  {index < workflowSteps.length - 1 && <div className="step-connector-line" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive SaaS Workspace Mockup */}
          <div className="workspace-dashboard-mockup">
            <div className="mockup-header-bar">
              <div className="mockup-window-controls">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <div className="mockup-tab-title">Physica AI Workspace v1.0.4</div>
              <div className="mockup-actions-stub" />
            </div>

            <div className="mockup-workspace-body">
              {/* Row 1: Search Panel */}
              <div
                className={`panel-container search-panel ${
                  activeStep >= 0 ? "revealed" : "hidden-panel"
                } ${activeStep === 0 ? "highlight" : ""}`}
              >
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

              {/* Core Workspace Area: Three-column layout */}
              <div className="workspace-columns-area">
                {/* Column A: Discovery list */}
                <div
                  className={`panel-container discovery-panel ${
                    activeStep >= 1 ? "revealed" : "hidden-panel"
                  } ${activeStep === 1 ? "highlight" : ""}`}
                >
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

                {/* Column B: Paper Viewer */}
                <div
                  className={`panel-container viewer-panel flex-2 ${
                    activeStep >= 2 ? "revealed" : "hidden-panel"
                  } ${[2, 5].includes(activeStep) ? "highlight" : ""}`}
                >
                  <div className="panel-header">Research Paper Viewer</div>
                  <div className="paper-viewer-content">
                    <h1 className="paper-headline">Anomalous Hall Conductivity in Layered Lattice Bilayers</h1>
                    <p className="paper-abstract">
                      We present a detailed experimental study of the electronic properties of graphene lattices under high magnetic fields. We observe quantized Hall conductivity corresponding to...
                    </p>
                    {/* Equation container */}
                    <div
                      className={`math-equation-block ${
                        activeStep === 5 ? "equation-highlight" : ""
                      }`}
                    >
                      <span className="equation-math">σ_xy = ν · (e² / h)</span>
                      {activeStep === 5 && (
                        <div className="equation-tooltip-popover">
                          <div className="tooltip-title">Hall Conductivity Breakdown</div>
                          <p className="tooltip-body">
                            <strong>σ_xy</strong>: Transverse conductivity.<br />
                            <strong>ν</strong>: Filling factor (integer/fractional).<br />
                            <strong>e²/h</strong>: Quantum unit of conductance.
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="paper-body-paragraph">
                      The observed quantization is robust against thermal excitations up to T = 4.2 K, validating lattice stability models.
                    </p>
                  </div>
                </div>

                {/* Column C: AI Sidebars */}
                <div className="workspace-sidebar-panels">
                  {/* Summary / Findings */}
                  <div
                    className={`panel-container summary-panel ${
                      activeStep >= 3 ? "revealed" : "hidden-panel"
                    } ${[3, 4].includes(activeStep) ? "highlight" : ""}`}
                  >
                    <div className="panel-header">AI Companion & Findings</div>
                    <div className="ai-companion-content">
                      <div className="ai-section-title">Key Findings</div>
                      <ul className="ai-bullets-list">
                        <li className={activeStep >= 4 ? "active-finding" : ""}>
                          Discovered anomalous Hall conductivity states at 4.2 K.
                        </li>
                        <li>Validated fractional lattices under robust field configurations.</li>
                        <li>Proved topological invariant protections inside bilayer graphene.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Citations / Related Papers */}
                  <div
                    className={`panel-container citations-panel ${
                      activeStep >= 6 ? "revealed" : "hidden-panel"
                    } ${activeStep === 6 ? "highlight" : ""}`}
                  >
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

                  {/* Research Notes & Insights */}
                  <div
                    className={`panel-container notes-panel ${
                      activeStep >= 7 ? "revealed" : "hidden-panel"
                    } ${activeStep === 7 ? "highlight" : ""}`}
                  >
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

            {/* Mockup footer status */}
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
    </section>
  );
}
