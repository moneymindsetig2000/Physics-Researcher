import { PromptCardsGrid } from './PromptCardsGrid';

export function WelcomeState() {
  return (
    <div className="welcome-state">
      {/* Large wizard hat icon */}
      <div className="welcome-logo-wrapper">
        <div className="welcome-logo-glow"></div>
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="welcome-logo-svg">
          <path d="m12 3-1.912 5.886L4.2 9l5.886 1.912L12 16.8l1.912-5.888L19.8 9l-5.886-1.914Z" fill="currentColor" stroke="none" />
          <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
        </svg>
      </div>
      <h2 className="welcome-title">Where knowledge begins</h2>
      <p className="welcome-subtitle">Uses multiple sources and tools to answer questions with citations.</p>

      {/* Grid of Action Cards */}
      <PromptCardsGrid />
    </div>
  );
}
