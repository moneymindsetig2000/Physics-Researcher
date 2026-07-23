import { motion } from 'motion/react';
import { PromptCardsGrid } from './PromptCardsGrid';

interface WelcomeStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function WelcomeState({ onSelectPrompt }: WelcomeStateProps) {
  return (
    <div className="welcome-state">
      <motion.svg
        className="welcome-logo-svg logo-svg"
        viewBox="0 0 100 100"
        width="80"
        height="80"
        aria-hidden="true"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(90, 50, 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="3.5" transform="rotate(150, 50, 50)" />
        <circle cx="50" cy="50" r="7" fill="currentColor" />
      </motion.svg>
      <motion.h2
        className="welcome-title"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        Radha's physics research companion
      </motion.h2>
      <motion.p
        className="welcome-subtitle"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
      >
        Powered by arXiv and INSPIRE — crafted just for you, Radha. Explore, question, and discover.
      </motion.p>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.26 }}
      >
        <PromptCardsGrid onSelectPrompt={onSelectPrompt} />
      </motion.div>
    </div>
  );
}
