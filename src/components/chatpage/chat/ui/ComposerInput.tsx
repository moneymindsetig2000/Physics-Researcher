import React, { useRef, useEffect, useState } from 'react';

interface ComposerInputProps {
  message: string;
  onChange: (message: string) => void;
  onSend: (mode: 'fast' | 'thinking' | 'deep') => void;
}

export function ComposerInput({ 
  message, 
  onChange, 
  onSend
}: ComposerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [answeringMode, setAnsweringMode] = useState<'fast' | 'thinking' | 'deep'>('thinking');

  // Automatically adjust height on message changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
      
      // Allow scrolling only after reaching the max-height limit (160px)
      if (scrollHeight >= 160) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(answeringMode);
    }
  };

  return (
    <div className="chat-input-capsule">
      <div className="composer-dropdown-wrapper" ref={dropdownRef}>
        <button 
          className="composer-add-btn" 
          id="btn-add-attachment" 
          aria-label="Add Attachment"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="add-icon-svg">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="tooltip tooltip-above tooltip-left-align">Toggle files attachment panel and model answering mode presets.</span>
        </button>
        <div className={`composer-dropdown-content ${isOpen ? 'open' : ''}`} id="composer-dropdown">
          <button 
            className={`composer-dropdown-item ${answeringMode === 'fast' ? 'selected' : ''}`} 
            id="item-mode-fast" 
            onClick={() => { setAnsweringMode('fast'); setIsOpen(false); }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 550 }}>Fast Answer</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>No thinking</span>
            </div>
            {answeringMode === 'fast' && (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', color: '#10b981' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <button 
            className={`composer-dropdown-item ${answeringMode === 'thinking' ? 'selected' : ''}`} 
            id="item-mode-thinking" 
            onClick={() => { setAnsweringMode('thinking'); setIsOpen(false); }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6M10 22h4" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 550 }}>Thinking</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Thinks before answering</span>
            </div>
            {answeringMode === 'thinking' && (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', color: '#10b981' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <button 
            className={`composer-dropdown-item ${answeringMode === 'deep' ? 'selected' : ''}`} 
            id="item-mode-deep" 
            onClick={() => { setAnsweringMode('deep'); setIsOpen(false); }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 550 }}>Deep Reasoning</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Deep research, takes longer</span>
            </div>
            {answeringMode === 'deep' && (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', color: '#10b981' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="composer-textarea"
        placeholder="Ask anything..."
        value={message}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        id="input-chat-message"
      />
      <button 
        className="composer-send-btn" 
        id="btn-send-message" 
        aria-label="Send Message"
        onClick={() => onSend(answeringMode)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="send-icon-svg">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        <span className="tooltip tooltip-above tooltip-right-align">Send query to the physics intelligence companion.</span>
      </button>
    </div>
  );
}
