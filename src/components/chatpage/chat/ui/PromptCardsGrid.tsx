export function PromptCardsGrid() {
  return (
    <div className="prompt-cards-grid" id="prompt-suggestions">
      <button className="prompt-card" id="card-updated">
        <span className="card-label">Stay Updated</span>
        <p className="card-text">Rental Prices in North American Cities.</p>
      </button>
      <button className="prompt-card" id="card-research">
        <span className="card-label">Research</span>
        <p className="card-text">Overview of the Solar Panel Industry.</p>
      </button>
      <button className="prompt-card" id="card-learn">
        <span className="card-label">Learn a topic</span>
        <p className="card-text">Detailed explanation of trigonometry.</p>
      </button>
    </div>
  );
}
