import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DashboardTab } from './ui/DashboardTab';
import { FineTuningTab } from './ui/FineTuningTab';
import { PromptProTab } from './ui/PromptProTab';
import { ProfileTab } from './ui/ProfileTab';
import { DocsTab } from './ui/DocsTab';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
}

type TabType = 'dashboard' | 'fine-tuning' | 'promptpro' | 'profile' | 'docs';

export function SettingsModal({ isOpen, isClosing, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab isOpen={isOpen} />;
      case 'fine-tuning':
        return <FineTuningTab />;
      case 'promptpro':
        return <PromptProTab />;
      case 'profile':
        return <ProfileTab />;
      case 'docs':
        return <DocsTab />;
      default:
        return null;
    }
  };

  return createPortal(
    <div 
      className={`settings-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={onClose}
    >
      <div 
        className="settings-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Settings Sidebar */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h3>Settings</h3>
          </div>

          <div className="settings-nav-group">
            <span className="settings-group-label">Features</span>
            <ul className="settings-nav-list">
              <li className={activeTab === 'dashboard' ? 'active' : ''}>
                <button onClick={() => setActiveTab('dashboard')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                  <span>Dashboard</span>
                </button>
              </li>

              <li className={activeTab === 'fine-tuning' ? 'active' : ''}>
                <button onClick={() => setActiveTab('fine-tuning')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span>Fine-tuning</span>
                </button>
              </li>
              <li className={activeTab === 'promptpro' ? 'active' : ''}>
                <button onClick={() => setActiveTab('promptpro')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <span>PromptPro</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="settings-nav-group">
            <span className="settings-group-label">Account</span>
            <ul className="settings-nav-list">
              <li className={activeTab === 'profile' ? 'active' : ''}>
                <button onClick={() => setActiveTab('profile')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>My Profile</span>
                </button>
              </li>
              <li className={activeTab === 'docs' ? 'active' : ''}>
                <button onClick={() => setActiveTab('docs')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Docs</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Right Settings Content Area */}
        <main className="settings-content-panel">
          {/* Close button */}
          <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {renderTabContent()}
        </main>
      </div>
    </div>,
    document.body
  );
}
