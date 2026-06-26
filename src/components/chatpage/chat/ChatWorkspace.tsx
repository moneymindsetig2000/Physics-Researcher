import { useState } from 'react';
import { WorkspaceHeader } from './ui/WorkspaceHeader';
import { WelcomeState } from './ui/WelcomeState';
import { ActiveToolsPills } from './ui/ActiveToolsPills';
import { ComposerInput } from './ui/ComposerInput';
import { WorkspaceFooter } from './ui/WorkspaceFooter';
import './ChatWorkspace.css';

interface ChatWorkspaceProps {
  toolsState: {
    pythonRunner: boolean;
    calculator: boolean;
    webSearch: boolean;
    urlScraper: boolean;
    imageUploader: boolean;
  };
  onToggleTool: (toolKey: string) => void;
}

export function ChatWorkspace({ toolsState, onToggleTool }: ChatWorkspaceProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div className="supernova-chat-workspace" id="chat-workspace-container">
      {/* Workspace Header */}
      <WorkspaceHeader />

      {/* Main Chat Flow Area (centered welcome state) */}
      <main className="chat-flow-container" id="chat-flow">
        <WelcomeState />

        {/* Bottom Composer and Tools Container */}
        <div className="composer-container">
          {/* Active Tools Pills */}
          <ActiveToolsPills toolsState={toolsState} onRemoveTool={onToggleTool} />

          {/* Chat Input Capsule */}
          <ComposerInput 
            message={message} 
            onChange={setMessage} 
            onSend={handleSend} 
            toolsState={toolsState}
            onToggleTool={onToggleTool}
          />
        </div>
      </main>

      {/* Workspace Footer */}
      <WorkspaceFooter />
    </div>
  );
}

