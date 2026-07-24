import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { WorkspaceHeader } from './ui/WorkspaceHeader';
import { WelcomeState } from './ui/WelcomeState';
import { ComposerInput } from './ui/ComposerInput';
import { WorkspaceFooter } from './ui/WorkspaceFooter';
import { ArchitectureTraceBlock } from './ui/ArchitectureTraceBlock';
import { MarkdownRenderer } from './ui/markdowns/MarkdownRenderer';
import ThinkingLoader from './ui/ThinkingLoader';
import { UserPromptScrubber } from './ui/UserPromptScrubber';
import { ConversationDivider } from './ui/ConversationDivider';
import { MessageActions } from './ui/MessageActions';
import { SelectionToolbar } from './ui/SelectionToolbar';
import { SummaryPopup } from './ui/SummaryPopup';
import { QuestionForm } from './ui/QuestionForm';
import type { TraceRecord } from '../../../utils/ai/types';
import './ChatWorkspace.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  thought?: string;
  trace?: TraceRecord;
  images?: string[];
  pdfs?: string[];
  versions?: { text: string; responseText?: string; responseThought?: string; questionForm?: { question: string; options: string[] } }[];
  questionForm?: { question: string; options: string[] };
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  summary?: string | null;
}

interface ChatWorkspaceProps {
  isRightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  isLeftSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  activeChat: Chat | null;
  onSendPrompt: (promptText: string, attachedImages?: string[], attachedPdfs?: string[], thinkingMode?: 'instant' | 'thinking') => void;
  onEditPrompt?: (userMsgId: string, newText: string, aiMsgId: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  summary?: string | null;
  isSummaryGenerating?: boolean;
}

// Radha
const TYPEWRITER_SPEED = 4; // Radha

const MessageItem = React.memo(({ 
  msg,
  onImageClick,
  onPdfClick,
  isGenerating,
  onEditMessage,
  activeVersion,
  onVersionChange,
  totalVersions,
  allVersions,
  onSendPrompt,
  isLatestUserMessage,
  onEditInComposer
}: { 
  msg: Message;
  onImageClick?: (url: string) => void;
  onPdfClick?: (url: string) => void;
  isGenerating?: boolean;
  onEditMessage?: (userMsgId: string, currentText: string) => void;
  activeVersion?: number;
  onVersionChange?: (version: number) => void;
  totalVersions?: number;
  allVersions?: { text: string; responseText?: string; responseThought?: string }[];
  onSendPrompt?: (text: string) => void;
  isLatestUserMessage?: boolean;
  onEditInComposer?: (text: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [displayedThought, setDisplayedThought] = useState('');
  const indexTextRef = useRef(0);
  const indexThoughtRef = useRef(0);
  const bufferTextRef = useRef(msg.text);
  const bufferThoughtRef = useRef(msg.thought || '');
  const generatingRef = useRef(isGenerating);
  const rafRef = useRef<number | null>(null);
  const thinkingContentRef = useRef<HTMLDivElement>(null);
  const aiContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayText = msg.sender === 'user' && allVersions && activeVersion !== undefined && activeVersion < (totalVersions ?? 0)
    ? allVersions[activeVersion].text
    : msg.text;

  const displayResponseText = msg.sender === 'ai' && allVersions && activeVersion !== undefined && activeVersion < (totalVersions ?? 0) && allVersions[activeVersion].responseText
    ? allVersions[activeVersion].responseText!
    : displayedText;

  const displayResponseThought = msg.sender === 'ai' && allVersions && activeVersion !== undefined && activeVersion < (totalVersions ?? 0) && allVersions[activeVersion].responseThought
    ? allVersions[activeVersion].responseThought!
    : displayedThought;

  const displayQuestionForm = msg.sender === 'ai' && allVersions && activeVersion !== undefined && activeVersion < (totalVersions ?? 0) && allVersions[activeVersion].questionForm
    ? allVersions[activeVersion].questionForm!
    : msg.questionForm;

  generatingRef.current = isGenerating;
  bufferTextRef.current = msg.text;
  bufferThoughtRef.current = msg.thought || '';

  useEffect(() => {
    if (thinkingContentRef.current) {
      const el = thinkingContentRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [displayResponseThought]);

  useEffect(() => {
    if (aiContentRef.current) {
      const parent = aiContentRef.current.closest('.conversation-flow') as HTMLElement | null;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [displayResponseText]);

  const scrollToBottom = useCallback(() => {
    if (aiContentRef.current) {
      const parent = aiContentRef.current.closest('.conversation-flow') as HTMLElement | null;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    if (!generatingRef.current) {
      indexTextRef.current = bufferTextRef.current.length;
      indexThoughtRef.current = bufferThoughtRef.current.length;
      setDisplayedText(bufferTextRef.current);
      setDisplayedThought(bufferThoughtRef.current);
      return;
    }

    // Don't restart typewriter for messages that already have content (edit of another msg)
    if (bufferTextRef.current) return;

    indexTextRef.current = 0;
    indexThoughtRef.current = 0;
    setDisplayedText('');
    setDisplayedThought('');

    const tick = () => {
      const textDone = indexTextRef.current >= bufferTextRef.current.length;
      const thoughtDone = indexThoughtRef.current >= bufferThoughtRef.current.length;

      if (!generatingRef.current && textDone && thoughtDone) {
        rafRef.current = null;
        return;
      }

      if (!generatingRef.current) {
        setDisplayedText(bufferTextRef.current);
        setDisplayedThought(bufferThoughtRef.current);
        indexTextRef.current = bufferTextRef.current.length;
        indexThoughtRef.current = bufferThoughtRef.current.length;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!textDone) {
        indexTextRef.current = Math.min(indexTextRef.current + TYPEWRITER_SPEED, bufferTextRef.current.length);
        setDisplayedText(bufferTextRef.current.slice(0, indexTextRef.current));
      }

      if (!thoughtDone) {
        indexThoughtRef.current = Math.min(indexThoughtRef.current + TYPEWRITER_SPEED + 1, bufferThoughtRef.current.length);
        setDisplayedThought(bufferThoughtRef.current.slice(0, indexThoughtRef.current));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [msg.id, isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      indexTextRef.current = bufferTextRef.current.length;
      indexThoughtRef.current = bufferThoughtRef.current.length;
      setDisplayedText(bufferTextRef.current);
      setDisplayedThought(bufferThoughtRef.current);
      scrollToBottom();
    }
  }, [isGenerating, scrollToBottom]);

  const typewriterDone = displayResponseText.length >= (msg.text?.length || 0) &&
    displayResponseThought.length >= ((msg.thought || '').length || 0);

  const handleEditStart = () => {
    if (!isLatestUserMessage) {
      onEditInComposer?.(displayText);
      return;
    }
    setEditText(displayText);
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(editText.length, editText.length);
      }
    }, 50);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleEditSend = () => {
    if (!editText.trim() || !onEditMessage) return;
    onEditMessage(msg.id, editText.trim());
    setIsEditing(false);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSend();
    }
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`} data-message-id={msg.id}>
      {msg.sender === 'user' ? (
        <div className="user-message-wrapper">
          {msg.images && msg.images.length > 0 && (
            <div className="user-message-images-row">
              {msg.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt="user attachment" 
                  onClick={() => onImageClick?.(img)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          )}
          {msg.pdfs && msg.pdfs.length > 0 && (
            <div className="user-message-files-row">
              {msg.pdfs.map((pdf, idx) => (
                  <div 
                    key={idx} 
                    className="message-file-card" 
                    onClick={() => onPdfClick?.(pdf)}
                    title="Click to preview PDF"
                  >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="message-file-card-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span className="message-file-card-name">PDF Document {msg.pdfs!.length > 1 ? `#${idx + 1}` : ''}</span>
                </div>
              ))}
            </div>
          )}
          <motion.div
            layout
            className={`user-message-box${isEditing ? ' editing' : ''}`}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {isEditing ? (
              <>
                <textarea
                  ref={textareaRef}
                  className="edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <div className="edit-actions">
                  <button className="edit-btn edit-cancel-btn" onClick={handleEditCancel}>Cancel</button>
                  <button className="edit-btn edit-send-btn" onClick={handleEditSend}>Send</button>
                </div>
              </>
            ) : (
              <MarkdownRenderer content={displayText} />
            )}
          </motion.div>
          {!isEditing && (
            <div className="user-actions-row">
              {totalVersions > 0 && (
                <div className="version-switcher">
                  <button
                    className="version-nav-btn"
                    onClick={() => onVersionChange?.((activeVersion ?? 0) - 1)}
                    disabled={activeVersion === 0}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="version-counter">
                    <motion.span
                      className="version-current"
                      key={activeVersion}
                      initial={{ rotateX: -90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ perspective: 120 }}
                    >{activeVersion! + 1}</motion.span>
                    <span className="version-sep">/</span>
                    <span className="version-total">{totalVersions}</span>
                  </div>
                  <button
                    className="version-nav-btn"
                    onClick={() => onVersionChange?.((activeVersion ?? 0) + 1)}
                    disabled={activeVersion === (totalVersions ?? 1) - 1}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
              <MessageActions text={displayText} sender="user" onEdit={handleEditStart} messageId={msg.id} />
            </div>
          )}
        </div>
      ) : (
        <div className="ai-message-ground">
          {bufferThoughtRef.current && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="ai-thinking-box"
            >
              <div className="thinking-header">
                <span>Thinking Process</span>
                <button
                  className="thinking-toggle-btn"
                  onClick={() => setIsThinkingExpanded(prev => !prev)}
                  title={isThinkingExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {isThinkingExpanded
                      ? <polyline points="18 15 12 9 6 15" />
                      : <polyline points="6 9 12 15 18 9" />
                    }
                  </svg>
                </button>
              </div>
              <div ref={thinkingContentRef} className={`thinking-content ${isThinkingExpanded ? 'expanded' : 'collapsed'}`}>{displayResponseThought}</div>
            </motion.div>
          )}
          {displayResponseText && <div ref={aiContentRef}><MarkdownRenderer content={displayResponseText} /></div>}
          {!bufferThoughtRef.current && !bufferTextRef.current && (
            <div className="ai-message-loader">
              <ThinkingLoader />
            </div>
          )}
          {msg.trace && <ArchitectureTraceBlock trace={msg.trace} />}
          {displayQuestionForm && typewriterDone && !isGenerating && (
            <QuestionForm
              question={displayQuestionForm.question}
              options={displayQuestionForm.options}
              onAnswer={(answer) => onSendPrompt?.(answer)}
            />
          )}
          {!isGenerating && displayResponseText && (
            <div className="ai-actions-row">
              <MessageActions text={msg.text} sender="ai" contentRef={aiContentRef} messageId={msg.id} />
              {totalVersions > 0 && (
                <div className="version-switcher">
                  <button
                    className="version-nav-btn"
                    onClick={() => onVersionChange?.((activeVersion ?? 0) - 1)}
                    disabled={activeVersion === 0}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="version-counter">
                    <motion.span
                      className="version-current"
                      key={activeVersion}
                      initial={{ rotateX: -90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ perspective: 120 }}
                    >{activeVersion! + 1}</motion.span>
                    <span className="version-sep">/</span>
                    <span className="version-total">{totalVersions}</span>
                  </div>
                  <button
                    className="version-nav-btn"
                    onClick={() => onVersionChange?.((activeVersion ?? 0) + 1)}
                    disabled={activeVersion === (totalVersions ?? 1) - 1}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.text === nextProps.msg.text &&
    prevProps.msg.thought === nextProps.msg.thought &&
    prevProps.msg.trace === nextProps.msg.trace &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.activeVersion === nextProps.activeVersion &&
    prevProps.totalVersions === nextProps.totalVersions &&
    (prevProps.msg.images === nextProps.msg.images || 
      (Array.isArray(prevProps.msg.images) && Array.isArray(nextProps.msg.images) && 
       prevProps.msg.images.length === nextProps.msg.images.length &&
       prevProps.msg.images.every((img, idx) => img === nextProps.msg.images![idx]))) &&
    (prevProps.msg.pdfs === nextProps.msg.pdfs || 
      (Array.isArray(prevProps.msg.pdfs) && Array.isArray(nextProps.msg.pdfs) && 
       prevProps.msg.pdfs.length === nextProps.msg.pdfs.length &&
       prevProps.msg.pdfs.every((pdf, idx) => pdf === nextProps.msg.pdfs![idx])))
  );
});

export function ChatWorkspace({ 
  isRightSidebarCollapsed, 
  onToggleRightSidebar,
  isLeftSidebarCollapsed,
  onToggleLeftSidebar,
  activeChat,
  onSendPrompt,
  onEditPrompt,
  isGenerating,
  onStopGeneration,
  summary,
  isSummaryGenerating
}: ChatWorkspaceProps) {
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [taggedText, setTaggedText] = useState<string | null>(null);
  const [showTaggedPill, setShowTaggedPill] = useState(false);
  const [selectionState, setSelectionState] = useState<{
    text: string;
    position: { top: number; left: number } | null;
  } | null>(null);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [versionMap, setVersionMap] = useState<Record<string, number>>({});
  const conversationFlowRef = useRef<HTMLDivElement>(null);
  const hasActiveSelectionRef = useRef(false);
  const mouseUpPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (taggedText) setShowTaggedPill(true);
  }, [taggedText]);

  const handleExitComplete = () => {
    if (!taggedText) setShowTaggedPill(false);
  };

  useEffect(() => {
    if (conversationFlowRef.current && activeChat?.messages.length) {
      const el = conversationFlowRef.current;
      conversationFlowRef.current.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  useEffect(() => {
    const hasSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return null;

      let node = sel.anchorNode;
      let el: Element | null = node?.nodeType === 3 ? node.parentElement : node as Element;

      while (el) {
        if (el.classList?.contains('ai-message-ground') || el.classList?.contains('user-message-box')) return sel;
        el = el.parentElement;
      }
      return null;
    };

    let rafId: number | null = null;

    const handleMouseUp = (e: MouseEvent) => {
      mouseUpPosRef.current = { x: e.clientX, y: e.clientY };
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const sel = hasSelection();
        if (!sel) {
          if (hasActiveSelectionRef.current) {
            hasActiveSelectionRef.current = false;
            setSelectionState(null);
          }
          return;
        }
        hasActiveSelectionRef.current = true;
        const mousePos = mouseUpPosRef.current;
        const pos = mousePos
          ? { top: mousePos.y - 40, left: Math.max(12, mousePos.x) }
          : { top: 0, left: 12 };
        setSelectionState({
          text: sel.toString().trim(),
          position: pos,
        });
      });
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleAskAi = (text: string) => {
    setTaggedText(text);
    setSelectionState(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleDownloadPdf = (pdfDataUrl: string) => {
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditInComposer = (text: string) => {
    setMessage(text);
  };

  const handleClearTaggedText = () => {
    setTaggedText(null);
  };

  const handleEditMessage = (userMsgId: string, newText: string) => {
    if (!onEditPrompt || !activeChat) return;
    const msgs = activeChat.messages;
    const userIdx = msgs.findIndex(m => m.id === userMsgId);
    if (userIdx === -1 || userIdx + 1 >= msgs.length) return;
    const aiMsg = msgs[userIdx + 1];
    if (aiMsg.sender !== 'ai') return;
    onEditPrompt(userMsgId, newText, aiMsg.id);
    setVersionMap(prev => {
      const versionsCount = (msgs[userIdx].versions?.length ?? 0) + 1;
      return { ...prev, [userMsgId]: versionsCount };
    });
  };

  const handleVersionChange = (userMsgId: string, version: number) => {
    setVersionMap(prev => ({ ...prev, [userMsgId]: version }));
  };

  const handleSend = (
    attachedImages: string[],
    attachedPdfs: string[],
    thinkingMode?: 'instant' | 'thinking'
  ) => {
    if (!message.trim() && attachedImages.length === 0 && attachedPdfs.length === 0 && !taggedText) return;
    const finalMessage = taggedText
      ? `"${taggedText}"\n\n${message}`
      : message;
    onSendPrompt(finalMessage, attachedImages, attachedPdfs, thinkingMode);
    setMessage('');
    setTaggedText(null);
  };

  return (
    <div className="supernova-chat-workspace" id="chat-workspace-container">
      {/* Workspace Header */}
      <WorkspaceHeader 
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onToggleRightSidebar={onToggleRightSidebar}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        onToggleLeftSidebar={onToggleLeftSidebar}
        onSummaryClick={() => setShowSummaryPopup(true)}
        hasMessages={!!activeChat && activeChat.messages.length > 0}
        isSummaryGenerating={isSummaryGenerating}
      />

      {/* Main Chat Flow Area (centered welcome state or message thread) */}
      <main className="chat-flow-container" id="chat-flow">
        {/* Top Blur Overlay */}
        <div className="workspace-blur-overlay-top" />

        {activeChat && activeChat.messages.length > 0 ? (
          <div className="conversation-flow" id="conversation-flow-list" ref={conversationFlowRef}>
            {activeChat.messages.map((msg, idx) => {
              const prev = idx > 0 ? activeChat.messages[idx - 1] : null;
              const showDivider = prev && prev.sender === 'ai' && msg.sender === 'user';

              const prevUserMsg = msg.sender === 'ai' && idx > 0 && activeChat.messages[idx - 1].sender === 'user'
                ? activeChat.messages[idx - 1]
                : null;

              const userMsgForVersion = msg.sender === 'user' ? msg : prevUserMsg;
              const hasVersions = userMsgForVersion && (userMsgForVersion.versions?.length ?? 0) > 0;
              const totalVersions = hasVersions ? (userMsgForVersion!.versions!.length + 1) : 0;
              const activeVer = hasVersions ? (versionMap[userMsgForVersion!.id] ?? totalVersions - 1) : 0;
              const allVersions = hasVersions
                ? [...userMsgForVersion!.versions!, { text: userMsgForVersion!.text, responseText: undefined, responseThought: undefined }]
                : undefined;

              const handleVerChange = hasVersions
                ? (v: number) => handleVersionChange(userMsgForVersion!.id, v)
                : undefined;

              const lastUserMsgIdx = activeChat.messages.reduce((last, m, i) => m.sender === 'user' ? i : last, -1);

              return (
                <React.Fragment key={msg.id}>
                  {showDivider && <ConversationDivider />}
                  <MessageItem
                    msg={msg}
                    onImageClick={setPreviewImage}
                    onPdfClick={setPreviewPdf}
                    isGenerating={isGenerating}
                    onEditMessage={handleEditMessage}
                    activeVersion={activeVer}
                    onVersionChange={handleVerChange}
                    totalVersions={totalVersions}
                    allVersions={allVersions}
                    onSendPrompt={(text) => onSendPrompt(text)}
                    isLatestUserMessage={msg.sender === 'user' && idx === lastUserMsgIdx}
                    onEditInComposer={handleEditInComposer}
                  />
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <WelcomeState onSelectPrompt={(text) => onSendPrompt(text, [])} />
        )}

        {/* Bottom Blur Overlay */}
        <div className="workspace-blur-overlay-bottom" />

          {/* Bottom Composer and Tools Container */}
          <div className={`composer-container${showTaggedPill ? ' has-tagged' : ''}`}>
            {/* Tagged text pill above input */}
            <AnimatePresence onExitComplete={handleExitComplete}>
              {taggedText && (
                <motion.div
                  key="tagged-pill"
                  className="tagged-text-pill"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 32 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="tagged-text-icon">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                  </svg>
                  <div className="tagged-text-label"><MarkdownRenderer content={taggedText} /></div>
                  <button className="tagged-text-remove" onClick={handleClearTaggedText} aria-label="Remove tagged text">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Chat Input Capsule */}
            <ComposerInput 
              message={message} 
              onChange={setMessage} 
              onSend={handleSend} 
              onImageClick={setPreviewImage}
              isGenerating={isGenerating}
              onStopGeneration={onStopGeneration}
            />
          </div>

          {selectionState && (
            <SelectionToolbar
              selectedText={selectionState.text}
              position={selectionState.position}
              onAskAi={handleAskAi}
              onDismiss={() => setSelectionState(null)}
            />
          )}
      </main>

      {activeChat && activeChat.messages.length > 0 && (
        <UserPromptScrubber 
          messages={activeChat.messages.reduce<{ id: string; text: string; aiId?: string }[]>((acc, m, i, arr) => {
            if (m.sender === 'user') {
              const next = arr[i + 1];
              acc.push({ id: m.id, text: m.text, aiId: next?.sender === 'ai' ? next.id : undefined });
            }
            return acc;
          }, [])}
          containerRef={conversationFlowRef}
        />
      )}

      {/* Workspace Footer */}
      <WorkspaceFooter />

      {/* Fullscreen Image Preview Modal (mounted using react Portal directly to document.body) */}
      {previewImage && createPortal(
        <div className="image-fullscreen-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-fullscreen-close-btn" 
              onClick={() => setPreviewImage(null)}
              aria-label="Close preview"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img src={previewImage} alt="Fullscreen Preview" className="image-fullscreen-content" />
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen PDF Preview Modal */}
      {previewPdf && createPortal(
        <div className="image-fullscreen-overlay" onClick={() => setPreviewPdf(null)}>
          <div className="pdf-fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-fullscreen-header">
              <div className="pdf-fullscreen-title">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>PDF Preview</span>
              </div>
              <div className="pdf-fullscreen-actions">
                <button
                  className="pdf-fullscreen-download-btn"
                  onClick={() => handleDownloadPdf(previewPdf)}
                  title="Download PDF"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button 
                  className="image-fullscreen-close-btn" 
                  onClick={() => setPreviewPdf(null)}
                  aria-label="Close preview"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <iframe
              src={previewPdf}
              className="pdf-fullscreen-viewer"
              title="PDF Preview"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Research Summary Popup */}
      <SummaryPopup
        summary={summary ?? null}
        isOpen={showSummaryPopup}
        onClose={() => setShowSummaryPopup(false)}
      />
    </div>
  );
}
