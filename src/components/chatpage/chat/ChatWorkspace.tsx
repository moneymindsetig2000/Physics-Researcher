import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
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
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

interface ChatWorkspaceProps {
  isRightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  isLeftSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  activeChat: Chat | null;
  onSendPrompt: (promptText: string, attachedImages?: string[], attachedPdfs?: string[]) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

const MessageItem = React.memo(({ 
  msg,
  onImageClick
}: { 
  msg: Message;
  onImageClick?: (url: string) => void;
}) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const thinkingContentRef = useRef<HTMLDivElement>(null);
  const aiContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thinkingContentRef.current) {
      thinkingContentRef.current.scrollTo({ top: thinkingContentRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [msg.thought]);

  const handleDownloadPdf = (pdfDataUrl: string) => {
    try {
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("PDF download failed", e);
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
                  onClick={() => handleDownloadPdf(pdf)}
                  title="Click to download PDF"
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
          <div className="user-message-box">
            <MarkdownRenderer content={msg.text} />
          </div>
          <MessageActions text={msg.text} sender="user" />
        </div>
      ) : (
        <div className="ai-message-ground">
          {msg.thought && (
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
              <div ref={thinkingContentRef} className={`thinking-content ${isThinkingExpanded ? 'expanded' : 'collapsed'}`}>{msg.thought}</div>
            </motion.div>
          )}
          {msg.text && <div ref={aiContentRef}><MarkdownRenderer content={msg.text} /></div>}
          {!msg.thought && !msg.text && (
            <div className="ai-message-loader">
              <ThinkingLoader />
            </div>
          )}
          {msg.trace && <ArchitectureTraceBlock trace={msg.trace} />}
          {msg.text && <MessageActions text={msg.text} sender="ai" contentRef={aiContentRef} />}
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
  isGenerating,
  onStopGeneration
}: ChatWorkspaceProps) {
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const conversationFlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationFlowRef.current && activeChat?.messages.length) {
      const el = conversationFlowRef.current;
      conversationFlowRef.current.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  const handleSend = (
    attachedImages: string[], 
    attachedPdfs: string[]
  ) => {
    if (!message.trim() && attachedImages.length === 0 && attachedPdfs.length === 0) return;
    onSendPrompt(message, attachedImages, attachedPdfs);
    setMessage('');
  };

  return (
    <div className="supernova-chat-workspace" id="chat-workspace-container">
      {/* Workspace Header */}
      <WorkspaceHeader 
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onToggleRightSidebar={onToggleRightSidebar}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        onToggleLeftSidebar={onToggleLeftSidebar}
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
              return (
                <React.Fragment key={msg.id}>
                  {showDivider && <ConversationDivider />}
                  <MessageItem msg={msg} onImageClick={setPreviewImage} />
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
        <div className="composer-container">
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
      </main>

      {activeChat && activeChat.messages.length > 0 && (
        <UserPromptScrubber 
          messages={activeChat.messages.filter(m => m.sender === 'user').map(m => ({ id: m.id, text: m.text }))}
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
    </div>
  );
}
