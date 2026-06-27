import { useState } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { ChatWorkspace } from './chat/ChatWorkspace';
import { RightSidebar } from './rightsidebar/RightSidebar';
import './ChatPage.css';

export function ChatPage() {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);

  return (
    <div className="supernova-chat-page" id="supernova-chat-page-root">
      {/* 3-Pane Layout */}
      <Sidebar 
        isCollapsed={isLeftSidebarCollapsed} 
        onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
      />
      <ChatWorkspace 
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onToggleRightSidebar={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        onToggleLeftSidebar={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
      />
      <RightSidebar 
        isCollapsed={isRightSidebarCollapsed} 
        onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)} 
      />
    </div>
  );
}
export default ChatPage;
