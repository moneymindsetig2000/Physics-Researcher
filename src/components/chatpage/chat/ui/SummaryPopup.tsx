import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useMemo } from 'react';
import { MarkdownRenderer } from './markdowns/MarkdownRenderer';
import './SummaryPopup.css';

interface SummaryPopupProps {
  summary: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SummaryPopup({ summary, isOpen, onClose }: SummaryPopupProps) {
  const markdownContent = useMemo(
    () => summary ? <MarkdownRenderer content={summary} /> : null,
    [summary]
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="summary-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
        >
          <motion.div
            className="summary-popup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="summary-popup-header">
              <span className="summary-popup-title">Research Summary</span>
              <button className="summary-popup-close" onClick={onClose} aria-label="Close summary">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="summary-popup-content">
              {markdownContent ?? (
                <p className="summary-popup-empty">No summary available yet. Start a conversation to generate one.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
