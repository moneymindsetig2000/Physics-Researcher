import { Sidebar } from './sidebar/Sidebar';
import { ChatWorkspace } from './chat/ChatWorkspace';
import { RightSidebar } from './rightsidebar/RightSidebar';
import './ChatPage.css';

export function ChatPage() {
  return (
    <div className="supernova-chat-page" id="supernova-chat-page-root">
      {/* 3-Pane Layout */}
      <Sidebar />
      <ChatWorkspace />
      <RightSidebar />
    </div>
  );
}
export default ChatPage;
