import { useState } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { ChatWorkspace } from './chat/ChatWorkspace';
import { RightSidebar } from './rightsidebar/RightSidebar';
import './ChatPage.css';

export function ChatPage() {
  const [toolsState, setToolsState] = useState({
    pythonRunner: true,
    calculator: true,
    imageUploader: false,
    scientificCalculator: true,
    researchSimulator: true,
    dataAnalysis: false,
    citationExplorer: false,
    equationWorkspace: false
  });

  const toggleTool = (toolKey: string) => {
    setToolsState(prev => ({
      ...prev,
      [toolKey]: !prev[toolKey as keyof typeof prev]
    }));
  };

  return (
    <div className="supernova-chat-page" id="supernova-chat-page-root">
      {/* 3-Pane Layout */}
      <Sidebar />
      <ChatWorkspace toolsState={toolsState} onToggleTool={toggleTool} />
      <RightSidebar toolsState={toolsState} onToggleTool={toggleTool} />
    </div>
  );
}
export default ChatPage;
