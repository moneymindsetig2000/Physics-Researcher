import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface PromptCard {
  label: string;
  text: string;
}

const PROMPT_POOL: PromptCard[] = [
  { label: 'Stay Updated', text: 'Latest experimental constraints on dark matter from LUX-ZEPLIN and PandaX-4T.' },
  { label: 'Stay Updated', text: 'Recent JWST observations challenging early galaxy formation models.' },
  { label: 'Stay Updated', text: 'New results from the Muon g-2 experiment at Fermilab.' },
  { label: 'Stay Updated', text: 'Advances in quantum computing using superconducting qubits in 2026.' },
  { label: 'Stay Updated', text: 'Latest constraints on primordial gravitational waves from BICEP/Keck.' },
  { label: 'Research', text: 'Derivation of the Gross-Pitaevskii equation and its application to Bose-Einstein condensates.' },
  { label: 'Research', text: 'Topological phases of matter and the search for Majorana fermions.' },
  { label: 'Research', text: 'AdS/CFT correspondence and its role in understanding strongly coupled systems.' },
  { label: 'Research', text: 'Neutrino mass hierarchy and the role of long-baseline experiments.' },
  { label: 'Research', text: 'Self-interacting dark matter models and small-scale structure problems.' },
  { label: 'Learn a topic', text: 'Explain the renormalization group and its application to critical phenomena.' },
  { label: 'Learn a topic', text: 'How does quantum error correction work in surface codes?' },
  { label: 'Learn a topic', text: 'What is the holographic principle and why does it matter?' },
  { label: 'Learn a topic', text: 'Derivation of Bell\'s inequality and its implications for quantum mechanics.' },
  { label: 'Learn a topic', text: 'How do Feynman diagrams work and what do they represent?' },
];

function shufflePool(): PromptCard[] {
  const pool = [...PROMPT_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

interface PromptCardsGridProps {
  onSelectPrompt: (promptText: string) => void;
}

export function PromptCardsGrid({ onSelectPrompt }: PromptCardsGridProps) {
  const [cards, setCards] = useState<PromptCard[]>([]);

  useEffect(() => {
    setCards(shufflePool());
  }, []);

  if (cards.length === 0) return null;

  return (
    <div className="prompt-cards-grid" id="prompt-suggestions">
      {cards.map((card, i) => (
        <motion.button
          key={i}
          className="prompt-card"
          id={i === 0 ? 'card-updated' : i === 1 ? 'card-research' : 'card-learn'}
          onClick={() => onSelectPrompt(card.text)}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.34 + i * 0.08 }}
        >
          <span className="card-label">{card.label}</span>
          <p className="card-text">{card.text}</p>
        </motion.button>
      ))}
    </div>
  );
}
