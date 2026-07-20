import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandHeader } from './ui/BrandHeader';
import { SidebarNavItem } from './ui/SidebarNavItem';
import { UserProfileBar } from './ui/UserProfileBar';
import { SettingsModal } from '../settings/SettingsModal';
import { DeleteConfirmationModal } from './options/DeleteConfirmationModal';
import { DashboardConfirmationModal } from './options/DashboardConfirmationModal';
import type { MemoryRecord } from '../../../utils/ai/types';
import './Sidebar.css';

interface Chat {
  id: string;
  name: string;
  isPinned?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onTogglePinChat: (id: string) => void;
  memories: MemoryRecord[];
  onUpdateMemories: (updated: MemoryRecord[]) => void;
  onClearAllChats: () => void;
}

export const Sidebar = React.memo(function Sidebar({ 
  isCollapsed, 
  onToggleCollapse,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onTogglePinChat,
  memories,
  onUpdateMemories,
  onClearAllChats
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  const handleCloseSettings = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setIsSettingsOpen(false);
      setIsSettingsClosing(false);
    }, 280); // matches CSS animation duration (280ms)
  };

  const pinnedChats = chats.filter(c => c.isPinned);
  const unpinnedChats = chats.filter(c => !c.isPinned);

  const layoutTransition = {
    type: 'tween',
    ease: [0.65, 0, 0.35, 1], // Slow start, accelerate, slow settle (Apple ease-in-out)
    duration: 0.5
  } as const;

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

      {/* Scrollable Navigation Groups Container with Layout orchestration */}
      <motion.div 
        layout 
        transition={layoutTransition}
        className="nav-group-container" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '1rem' }}
      >
        <AnimatePresence initial={false}>
          {/* Pinned Chats Section */}
          {pinnedChats.length > 0 && (
            <motion.div 
              key="pinned-section"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={layoutTransition}
              className="nav-group pinned-chats-group" 
              id="group-pinned"
            >
              <motion.span layout transition={layoutTransition} className="group-label">
                Pinned Chats
              </motion.span>
              <motion.ul layout transition={layoutTransition} className="nav-list">
                {pinnedChats.map((chat) => (
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
                    onDeleteClick={() => setChatToDelete(chat)}
                    onPinClick={() => onTogglePinChat(chat.id)}
                    isPinned={true}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    }
                  />
                ))}
              </motion.ul>
            </motion.div>
          )}

          {/* Regular Chats Section */}
          {(unpinnedChats.length > 0 || chats.length === 0) && (
            <motion.div 
              key="chats-section"
              layout
              transition={layoutTransition}
              className="nav-group" 
              id="group-features"
            >
              <motion.span layout transition={layoutTransition} className="group-label">
                Chats
              </motion.span>
              {unpinnedChats.length > 0 ? (
                <motion.ul layout transition={layoutTransition} className="nav-list">
                  {unpinnedChats.map((chat) => (
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
                      onDeleteClick={() => setChatToDelete(chat)}
                      onPinClick={() => onTogglePinChat(chat.id)}
                      isPinned={false}
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      }
                    />
                  ))}
                </motion.ul>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* User Section */}
      <div className="sidebar-footer-actions">
        <button className="dashboard-nav-btn" id="btn-dashboard-nav" onClick={() => setShowDashboardModal(true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Go to Dashboard</span>
        </button>
      </div>
      <UserProfileBar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Settings Modal Portal Overlay */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        isClosing={isSettingsClosing} 
        onClose={handleCloseSettings} 
        memories={memories}
        onUpdateMemories={onUpdateMemories}
        onClearAllChats={onClearAllChats}
      />

      {/* Delete Confirmation Modal Portal Overlay */}
      <DeleteConfirmationModal
        isOpen={chatToDelete !== null}
        chatName={chatToDelete?.name || ''}
        onConfirm={() => {
          if (chatToDelete) {
            onDeleteChat(chatToDelete.id);
            setChatToDelete(null);
          }
        }}
        onCancel={() => setChatToDelete(null)}
      />

      {/* Dashboard Confirmation Modal */}
      <DashboardConfirmationModal
        isOpen={showDashboardModal}
        onConfirm={() => {
          setShowDashboardModal(false);
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        onCancel={() => setShowDashboardModal(false)}
      />
    </aside>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.activeChatId === nextProps.activeChatId &&
    prevProps.onDeleteChat === nextProps.onDeleteChat &&
    prevProps.onTogglePinChat === nextProps.onTogglePinChat &&
    prevProps.onUpdateMemories === nextProps.onUpdateMemories &&
    prevProps.onClearAllChats === nextProps.onClearAllChats &&
    // Shallow compare memories array
    prevProps.memories.length === nextProps.memories.length &&
    prevProps.memories.every((m, i) => m.id === nextProps.memories[i].id && m.memory === nextProps.memories[i].memory) &&
    // Shallow compare array elements
    prevProps.chats.length === nextProps.chats.length &&
    prevProps.chats.every((c, i) => c.id === nextProps.chats[i].id && c.name === nextProps.chats[i].name && c.isPinned === nextProps.chats[i].isPinned)
  );
});
export default Sidebar;
