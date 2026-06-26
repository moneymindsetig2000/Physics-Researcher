import React, { useRef, useEffect } from 'react';

interface ComposerInputProps {
  message: string;
  onChange: (message: string) => void;
  onSend: () => void;
}

export function ComposerInput({ message, onChange, onSend }: ComposerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically adjust height on message changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-capsule">
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
        onClick={onSend}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="send-icon-svg">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}
