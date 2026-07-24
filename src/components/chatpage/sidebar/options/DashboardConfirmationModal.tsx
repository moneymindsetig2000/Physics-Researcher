import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './DashboardConfirmationModal.css';

interface DashboardConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DashboardConfirmationModal({
  isOpen,
  onConfirm,
  onCancel
}: DashboardConfirmationModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return createPortal(
    <div 
      className={`dashboard-modal-wrapper ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
    >
      <div 
        className="dashboard-modal-blur-backdrop" 
        onClick={onCancel} 
      />

      <div 
        className="dashboard-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 id="dashboard-modal-title">Leave Chat</h3>
        </div>

        <div className="dashboard-modal-body">
          <p>
            Are you sure you want to exit the chat?
          </p>
          <p className="dashboard-modal-warning-text" style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.35)' }}>
            Any unsaved progress in the current conversation will be preserved in your chat history.
          </p>
        </div>

        <div className="dashboard-modal-footer">
          <button 
            className="dashboard-modal-btn cancel-btn" 
            onClick={onCancel}
          >
            Stay Here
          </button>
          <button 
            className="dashboard-modal-btn confirm-btn" 
            onClick={onConfirm}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
