import { useEffect, useRef } from 'react';
import './SelectionToolbar.css';

interface SelectionToolbarProps {
  selectedText: string;
  position: { top: number; left: number } | null;
  onAskAi: (text: string) => void;
  onDismiss: () => void;
}

export function SelectionToolbar({ selectedText, position, onAskAi, onDismiss }: SelectionToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDismiss]);

  if (!position) return null;

  return (
    <div
      ref={toolbarRef}
      className="selection-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        className="selection-toolbar-btn"
        onClick={() => onAskAi(selectedText)}
        title="Ask AI about this selection"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        Ask AI
      </button>
    </div>
  );
}
