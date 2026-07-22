import { motion, AnimatePresence } from 'motion/react';
import './NewChatDialog.css';

interface NewChatDialogProps {
  isOpen: boolean;
  onContinueWithContext: () => void;
  onFreshStart: () => void;
  onDismiss: () => void;
}

export function NewChatDialog({ isOpen, onContinueWithContext, onFreshStart, onDismiss }: NewChatDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="new-chat-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          onClick={onDismiss}
        >
          <motion.div
            className="new-chat-dialog"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-chat-dialog-header">
              <span className="new-chat-dialog-title">New Research Session</span>
            </div>
            <div className="new-chat-dialog-body">
              <p className="new-chat-dialog-desc">
                Would you like to carry forward the context from your current session?
              </p>
              <div className="new-chat-dialog-options">
                <button className="new-chat-dialog-btn primary" onClick={onContinueWithContext}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <div className="new-chat-dialog-btn-text">
                    <span className="new-chat-dialog-btn-label">Continue with Context</span>
                    <span className="new-chat-dialog-btn-desc">Carry forward research summary and findings</span>
                  </div>
                </button>
                <button className="new-chat-dialog-btn secondary" onClick={onFreshStart}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <div className="new-chat-dialog-btn-text">
                    <span className="new-chat-dialog-btn-label">Fresh Start</span>
                    <span className="new-chat-dialog-btn-desc">Begin a completely new research session</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
