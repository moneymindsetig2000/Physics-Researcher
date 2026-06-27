export function PromptProTab() {
  return (
    <div className="tab-pane-content fade-in">
      <h2 className="tab-title">PromptPro Library</h2>
      <p className="tab-description">Save, share, and optimize custom prompts for physics research.</p>
      <div className="prompts-grid">
        <div className="prompt-item-card">
          <h4>Topological Phase Transition explainer</h4>
          <p className="prompt-snippet">"Detail the phase transitions of 2D electron systems using Haldane model equations..."</p>
          <button className="copy-prompt-btn">Copy Template</button>
        </div>
        <div className="prompt-item-card">
          <h4>Muon g-2 anomaly constraints formatter</h4>
          <p className="prompt-snippet">"Parse INSPIRE citation records and output Muon g-2 discrepancy constraints in a LaTeX table..."</p>
          <button className="copy-prompt-btn">Copy Template</button>
        </div>
      </div>
    </div>
  );
}
