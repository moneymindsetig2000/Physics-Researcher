import React, { useState } from 'react';
import { BrandHeader } from './ui/BrandHeader';
import { SidebarNavItem } from './ui/SidebarNavItem';
import { UserProfileBar } from './ui/UserProfileBar';
import { SettingsModal } from '../settings/SettingsModal';
import './Sidebar.css';

interface Chat {
  id: string;
  name: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export const Sidebar = React.memo(function Sidebar({ 
  isCollapsed, 
  onToggleCollapse,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);

  const handleCloseSettings = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setIsSettingsOpen(false);
      setIsSettingsClosing(false);
    }, 280); // matches CSS animation duration (280ms)
  };

  return (
    <aside className={`supernova-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="sidebar-container">
      {/* Brand Header */}
      <BrandHeader onToggleCollapse={onToggleCollapse} />

      {/* New Chat Button */}
      <button className="new-chat-btn" id="btn-new-chat" onClick={onNewChat}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="new-chat-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>New Chat</span>
      </button>

      {/* Navigation Group: Chats */}
      <div className="nav-group" id="group-features">
        <span className="group-label">Chats</span>
        {chats.length > 0 ? (
          <ul className="nav-list">
            {chats.map((chat) => (
              <SidebarNavItem
                key={chat.id}
                id={chat.id}
                href={`#${chat.id}`}
                label={chat.name}
                isActive={chat.id === activeChatId}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectChat(chat.id);
                }}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                }
              />
            ))}
          </ul>
        ) : (
          <div className="sidebar-empty-state" id="sidebar-chats-empty">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="empty-state-text">No active conversations</p>
          </div>
        )}
      </div>

      {/* User Section */}
      <UserProfileBar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Settings Modal Portal Overlay */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        isClosing={isSettingsClosing} 
        onClose={handleCloseSettings} 
      />
    </aside>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.activeChatId === nextProps.activeChatId &&
    // Shallow compare array elements
    prevProps.chats.length === nextProps.chats.length &&
    prevProps.chats.every((c, i) => c.id === nextProps.chats[i].id && c.name === nextProps.chats[i].name)
  );
});
