interface PromptCardsGridProps {
  onSelectPrompt: (promptText: string) => void;
}

export function PromptCardsGrid({ onSelectPrompt }: PromptCardsGridProps) {
  return (
    <div className="prompt-cards-grid" id="prompt-suggestions">
      <button 
        className="prompt-card" 
        id="card-updated"
        onClick={() => onSelectPrompt("Latest preprints on the muon g-2 anomaly.")}
      >
        <span className="card-label">Stay Updated</span>
        <p className="card-text">Latest preprints on the muon g-2 anomaly.</p>
      </button>
      <button 
        className="prompt-card" 
        id="card-research"
        onClick={() => onSelectPrompt("Anomaly constraints on dark matter candidate couplings.")}
      >
        <span className="card-label">Research</span>
        <p className="card-text">Anomaly constraints on dark matter candidate couplings.</p>
      </button>
      <button 
        className="prompt-card" 
        id="card-learn"
        onClick={() => onSelectPrompt("Detailed explanation of topological phase transitions.")}
      >
        <span className="card-label">Learn a topic</span>
        <p className="card-text">Detailed explanation of topological phase transitions.</p>
      </button>
    </div>
  );
}
