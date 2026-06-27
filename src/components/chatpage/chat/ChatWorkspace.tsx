import { useState } from 'react';
import { WorkspaceHeader } from './ui/WorkspaceHeader';
import { WelcomeState } from './ui/WelcomeState';
import { ComposerInput } from './ui/ComposerInput';
import { WorkspaceFooter } from './ui/WorkspaceFooter';
import './ChatWorkspace.css';

interface ChatWorkspaceProps {
  isRightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  isLeftSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
}

export function ChatWorkspace({ 
  isRightSidebarCollapsed, 
  onToggleRightSidebar,
  isLeftSidebarCollapsed,
  onToggleLeftSidebar
}: ChatWorkspaceProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
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

      {/* Main Chat Flow Area (centered welcome state) */}
      <main className="chat-flow-container" id="chat-flow">
        <WelcomeState />

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

