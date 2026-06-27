import { useState } from 'react';
import { BrandHeader } from './ui/BrandHeader';
import { SidebarNavItem } from './ui/SidebarNavItem';
import { UserProfileBar } from './ui/UserProfileBar';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>('chat');

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: string) => {
    if (item !== 'dashboard') {
      e.preventDefault();
      setActiveItem(item);
    }
  };

  return (
    <aside className={`supernova-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="sidebar-container">
      {/* Brand Header */}
      <BrandHeader onToggleCollapse={onToggleCollapse} />

      {/* Navigation Group: Features */}
      <div className="nav-group" id="group-features">
        <span className="group-label">Features</span>
        <ul className="nav-list">
          <SidebarNavItem
            id="dashboard"
            href="#dashboard"
            label="Dashboard"
            isActive={activeItem === 'dashboard'}
            onClick={(e) => handleNavClick(e, 'dashboard')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            }
          />
          <SidebarNavItem
            id="chat"
            href="#chat"
            label="Chat"
            isActive={activeItem === 'chat'}
            onClick={(e) => handleNavClick(e, 'chat')}
            badge="⌘G4"
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <SidebarNavItem
            id="llama-lab"
            href="#llama-lab"
            label="Llama Lab"
            isActive={activeItem === 'llama-lab'}
            onClick={(e) => handleNavClick(e, 'llama-lab')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M10 2v7.586l-6.707 6.707A2 2 0 0 0 6 20h12a2 2 0 0 0 2-2.707L14 10.414V2Z" />
                <path d="M8 2h8" />
              </svg>
            }
          />
          <SidebarNavItem
            id="fine-tuning"
            href="#fine-tuning"
            label="Fine-tuning"
            isActive={activeItem === 'fine-tuning'}
            onClick={(e) => handleNavClick(e, 'fine-tuning')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            }
          />
          <SidebarNavItem
            id="promptpro"
            href="#promptpro"
            label="PromptPro"
            isActive={activeItem === 'promptpro'}
            onClick={(e) => handleNavClick(e, 'promptpro')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            }
          />
        </ul>
      </div>

      {/* Navigation Group: Settings */}
      <div className="nav-group" id="group-settings">
        <span className="group-label">Settings</span>
        <ul className="nav-list">
          <SidebarNavItem
            id="profile"
            href="#profile"
            label="My Profile"
            isActive={activeItem === 'profile'}
            onClick={(e) => handleNavClick(e, 'profile')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
          <SidebarNavItem
            id="teams"
            href="#teams"
            label="Teams"
            isActive={activeItem === 'teams'}
            onClick={(e) => handleNavClick(e, 'teams')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <SidebarNavItem
            id="billing"
            href="#billing"
            label="Billing & Usage"
            isActive={activeItem === 'billing'}
            onClick={(e) => handleNavClick(e, 'billing')}
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />
          <SidebarNavItem
            id="docs"
            href="#docs"
            label="Docs"
            isActive={activeItem === 'docs'}
            onClick={(e) => handleNavClick(e, 'docs')}
            badge="⇧⌘D"
            icon={
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
        </ul>
      </div>

      {/* User Section */}
      <UserProfileBar />
    </aside>
  );
}

