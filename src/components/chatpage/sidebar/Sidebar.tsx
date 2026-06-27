import { useState } from 'react';
import { BrandHeader } from './ui/BrandHeader';
import { SidebarNavItem } from './ui/SidebarNavItem';
import { UserProfileBar } from './ui/UserProfileBar';
import { SettingsModal } from '../settings/SettingsModal';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>('chat-1');
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

      {/* Navigation Group: Chats */}
      <div className="nav-group" id="group-features">
        <span className="group-label">Chats</span>
        <ul className="nav-list">
          <SidebarNavItem
            id="chat-1"
            href="#chat-1"
            label="Muon g-2 anomaly preprints"
            isActive={activeItem === 'chat-1'}
            onClick={(e) => { e.preventDefault(); setActiveItem('chat-1'); }}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <SidebarNavItem
            id="chat-2"
            href="#chat-2"
            label="Topological Phase Transitions"
            isActive={activeItem === 'chat-2'}
            onClick={(e) => { e.preventDefault(); setActiveItem('chat-2'); }}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <SidebarNavItem
            id="chat-3"
            href="#chat-3"
            label="Dark Matter Coupling Review"
            isActive={activeItem === 'chat-3'}
            onClick={(e) => { e.preventDefault(); setActiveItem('chat-3'); }}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
        </ul>
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
}

