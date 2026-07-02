import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './DeleteConfirmationModal.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  chatName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  chatName,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
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
      }, 250); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return createPortal(
    <div 
      className={`delete-modal-wrapper ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* GPU accelerated static backdrop blur layer */}
      <div 
        className="delete-modal-blur-backdrop" 
        onClick={onCancel} 
      />
      
      {/* Modal Dialog Box */}
      <div 
        className="delete-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          <div className="delete-warning-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 id="delete-modal-title">Delete Chat</h3>
        </div>
        
        <div className="delete-modal-body">
          <p>
            Are you sure you want to delete <span className="highlight-chat-name">"{chatName}"</span>?
          </p>
          <p className="delete-modal-warning-text">
            This conversation will be permanently removed from your history and local storage. This action cannot be undone.
          </p>
        </div>

        <div className="delete-modal-footer">
          <button 
            className="delete-modal-btn cancel-btn" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="delete-modal-btn confirm-btn" 
            onClick={onConfirm}
          >
            Delete Chat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
