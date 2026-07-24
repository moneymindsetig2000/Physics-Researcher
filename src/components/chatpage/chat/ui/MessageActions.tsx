// Radha
import { useState, useEffect } from 'react'; // Radha
import { exportElementToPdf } from '../../../../utils/pdf/exportPdf';
import './MessageActions.css';

interface MessageActionsProps {
  text: string;
  sender: 'user' | 'ai';
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onEdit?: () => void;
  messageId?: string;
}

const LS_PREFIX = 'msg_like_';

function getStoredLike(messageId: string): boolean | null {
  try {
    const val = localStorage.getItem(LS_PREFIX + messageId);
    if (val === 'like') return true;
    if (val === 'dislike') return false;
  } catch {}
  return null;
}

function setStoredLike(messageId: string, value: boolean | null) {
  try {
    if (value === true) localStorage.setItem(LS_PREFIX + messageId, 'like');
    else if (value === false) localStorage.setItem(LS_PREFIX + messageId, 'dislike');
    else localStorage.removeItem(LS_PREFIX + messageId);
  } catch {}
}

export function MessageActions({ text, sender, contentRef, onEdit, messageId }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(() => messageId ? getStoredLike(messageId) : null);

  useEffect(() => {
    if (messageId) setLiked(getStoredLike(messageId));
  }, [messageId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const likeClass = liked === true ? 'like-active' : '';
  const dislikeClass = liked === false ? 'dislike-active' : '';

  const handleLike = (value: boolean) => {
    const next = liked === value ? null : value;
    setLiked(next);
    if (messageId) setStoredLike(messageId, next);
  };

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
            onClick={() => handleLike(true)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={liked === true ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span className="tooltip tooltip-above">Like this response</span>
          </button>
          <button
            className={`action-btn ${dislikeClass}`}
            onClick={() => handleLike(false)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={liked === false ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
            </svg>
            <span className="tooltip tooltip-above">Dislike this response</span>
          </button>
          <button
            className="action-btn pdf-btn"
            onClick={() => contentRef?.current && exportElementToPdf(contentRef.current, `message-${Date.now()}.pdf`)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="tooltip tooltip-above">Export as PDF</span>
          </button>
        </>
      )}
    </div>
  );
}
