import React from 'react';
import './ChatOptionsDropdown.css';

interface ChatOptionsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  onPinClick?: (e: React.MouseEvent) => void;
  isPinned?: boolean;
}

export function ChatOptionsDropdown({
  isOpen,
  onClose,
  onDeleteClick,
  onPinClick,
  isPinned
}: ChatOptionsDropdownProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="chat-options-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="dropdown-list">
        <li className="dropdown-item">
          <button 
            type="button" 
            className="dropdown-action-btn pin-action"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPinClick?.(e);
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
          </button>
        </li>
        <li className="dropdown-item">
          <button 
            type="button" 
            className="dropdown-action-btn delete-action"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteClick(e);
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="trash-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Chat</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
