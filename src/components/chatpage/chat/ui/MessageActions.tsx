import { useState } from 'react';
import { exportElementToPdf } from '../../../../utils/pdf/exportPdf';
import './MessageActions.css';

interface MessageActionsProps {
  text: string;
  sender: 'user' | 'ai';
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onEdit?: () => void;
}

export function MessageActions({ text, sender, contentRef, onEdit }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // silently fail
    }
  };

  const likeClass = liked === true ? 'like-active' : '';
  const dislikeClass = liked === false ? 'dislike-active' : '';

  return (
    <div className={`message-actions ${sender === 'user' ? 'user-actions' : 'ai-actions'}`}>
      <button
        className={`action-btn ${copied ? 'copy-active' : ''}`}
        onClick={handleCopy}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      {sender === 'user' && (
        <button className="action-btn" title="Edit" onClick={onEdit}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}

      {sender === 'ai' && (
        <>
          <button
            className={`action-btn ${likeClass}`}
            onClick={() => setLiked(liked === true ? null : true)}
            title="Like"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={liked === true ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
          </button>
          <button
            className={`action-btn ${dislikeClass}`}
            onClick={() => setLiked(liked === false ? null : false)}
            title="Dislike"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={liked === false ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
            </svg>
          </button>
          <button
            className="action-btn pdf-btn"
            onClick={() => contentRef?.current && exportElementToPdf(contentRef.current, `message-${Date.now()}.pdf`)}
            title="Export PDF"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
