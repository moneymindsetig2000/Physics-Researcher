import React, { useState } from 'react';
import { WorkspaceHeader } from './ui/WorkspaceHeader';
import { WelcomeState } from './ui/WelcomeState';
import { ComposerInput } from './ui/ComposerInput';
import { WorkspaceFooter } from './ui/WorkspaceFooter';
import { ArchitectureTraceBlock } from './ui/ArchitectureTraceBlock';
import type { TraceRecord } from '../../../utils/ai/types';
import './ChatWorkspace.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  thought?: string;
  trace?: TraceRecord;
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
  onSendPrompt: (promptText: string, mode: 'fast' | 'thinking' | 'deep') => void;
}

const MessageItem = React.memo(({ msg }: { msg: Message }) => {
  return (
    <div className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}>
      {msg.sender === 'user' ? (
        <div className="user-message-box">
          <p className="message-text">{msg.text}</p>
        </div>
      ) : (
        <div className="ai-message-ground">
          {msg.thought && (
            <div className="ai-thinking-box">
              <div className="thinking-header">
                <span className="thinking-dot"></span>
                <span>Thinking Process</span>
              </div>
              <div className="thinking-content">{msg.thought}</div>
            </div>
          )}
          {msg.text && <p className="message-text">{msg.text}</p>}
          {msg.trace && <ArchitectureTraceBlock trace={msg.trace} />}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.text === nextProps.msg.text &&
    prevProps.msg.thought === nextProps.msg.thought &&
    prevProps.msg.trace === nextProps.msg.trace
  );
});

export function ChatWorkspace({ 
  isRightSidebarCollapsed, 
  onToggleRightSidebar,
  isLeftSidebarCollapsed,
  onToggleLeftSidebar,
  activeChat,
  onSendPrompt
}: ChatWorkspaceProps) {
  const [message, setMessage] = useState('');

  const handleSend = (mode: 'fast' | 'thinking' | 'deep') => {
    if (!message.trim()) return;
    onSendPrompt(message, mode);
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
        {activeChat && activeChat.messages.length > 0 ? (
          <div className="conversation-flow" id="conversation-flow-list">
            {activeChat.messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} />
            ))}
          </div>
        ) : (
          <WelcomeState onSelectPrompt={(promptText) => onSendPrompt(promptText, 'thinking')} />
        )}

        {/* Bottom Composer and Tools Container */}
        <div className="composer-container">
          {/* Chat Input Capsule */}
          <ComposerInput 
            message={message} 
            onChange={setMessage} 
            onSend={handleSend} 
          />
        </div>
      </main>

      {/* Workspace Footer */}
      <WorkspaceFooter />
    </div>
  );
}

