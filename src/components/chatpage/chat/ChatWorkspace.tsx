import { useState } from 'react';
import { WorkspaceHeader } from './ui/WorkspaceHeader';
import { WelcomeState } from './ui/WelcomeState';
import { ComposerInput } from './ui/ComposerInput';
import { WorkspaceFooter } from './ui/WorkspaceFooter';
import './ChatWorkspace.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
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
  onSendPrompt: (promptText: string) => void;
}

export function ChatWorkspace({ 
  isRightSidebarCollapsed, 
  onToggleRightSidebar,
  isLeftSidebarCollapsed,
  onToggleLeftSidebar,
  activeChat,
  onSendPrompt
}: ChatWorkspaceProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSendPrompt(message);
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
              <div key={msg.id} className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}>
                {msg.sender === 'user' ? (
                  <div className="user-message-box">
                    <p className="message-text">{msg.text}</p>
                  </div>
                ) : (
                  <div className="ai-message-ground">
                    <p className="message-text">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <WelcomeState onSelectPrompt={onSendPrompt} />
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

