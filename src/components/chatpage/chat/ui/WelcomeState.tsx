import { PromptCardsGrid } from './PromptCardsGrid';

interface WelcomeStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function WelcomeState({ onSelectPrompt }: WelcomeStateProps) {
  return (
    <div className="welcome-state">
      {/* Large wizard hat icon */}
      <svg className="welcome-logo-svg logo-svg" viewBox="0 0 100 100" width="80" height="80" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(90, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(150, 50, 50)" />
        <circle cx="50" cy="50" r="7" fill="currentColor" />
      </svg>
      <h2 className="welcome-title">Where scientific discovery begins</h2>
      <p className="welcome-subtitle">Uses academic repositories like arXiv and INSPIRE to analyze physics papers with citations.</p>

      {/* Grid of Action Cards */}
      <PromptCardsGrid onSelectPrompt={onSelectPrompt} />
    </div>
  );
}
