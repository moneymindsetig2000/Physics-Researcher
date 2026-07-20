interface PromptCardsGridProps {
  onSelectPrompt: (promptText: string) => void;
}

export function PromptCardsGrid({ onSelectPrompt }: PromptCardsGridProps) {
  return (
    <div className="prompt-cards-grid" id="prompt-suggestions">
      <button 
        className="prompt-card" 
        id="card-updated"
        onClick={() => onSelectPrompt("Latest experimental constraints on dark matter from LUX-ZEPLIN and PandaX-4T.")}
      >
        <span className="card-label">Stay Updated</span>
        <p className="card-text">Latest experimental constraints on dark matter from LUX-ZEPLIN and PandaX-4T.</p>
      </button>
      <button 
        className="prompt-card" 
        id="card-research"
        onClick={() => onSelectPrompt("Derivation of the Gross-Pitaevskii equation and its application to Bose-Einstein condensates.")}
      >
        <span className="card-label">Research</span>
        <p className="card-text">Derivation of the Gross-Pitaevskii equation and its application to Bose-Einstein condensates.</p>
      </button>
      <button 
        className="prompt-card" 
        id="card-learn"
        onClick={() => onSelectPrompt("Explain the renormalization group and its application to critical phenomena.")}
      >
        <span className="card-label">Learn a topic</span>
        <p className="card-text">Explain the renormalization group and its application to critical phenomena.</p>
      </button>
    </div>
  );
}
