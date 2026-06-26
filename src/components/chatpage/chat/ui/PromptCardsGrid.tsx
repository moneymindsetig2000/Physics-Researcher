export function PromptCardsGrid() {
  return (
    <div className="prompt-cards-grid" id="prompt-suggestions">
      <button className="prompt-card" id="card-updated">
        <span className="card-label">Stay Updated</span>
        <p className="card-text">Latest preprints on the muon g-2 anomaly.</p>
      </button>
      <button className="prompt-card" id="card-research">
        <span className="card-label">Research</span>
        <p className="card-text">Anomaly constraints on dark matter candidate couplings.</p>
      </button>
      <button className="prompt-card" id="card-learn">
        <span className="card-label">Learn a topic</span>
        <p className="card-text">Detailed explanation of topological phase transitions.</p>
      </button>
    </div>
  );
}
