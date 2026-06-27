import { useState } from 'react';
import { RightPanelHeader } from './ui/RightPanelHeader';
import { PanelTabs } from './ui/PanelTabs';
import './RightSidebar.css';

interface RightSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function RightSidebar({ isCollapsed, onToggleCollapse }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'files'>('tools');
  const [memories, setMemories] = useState<string[]>([]);
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleAddMemory = () => {
    const text = window.prompt("Enter new research memory:");
    if (text && text.trim()) {
      setMemories([...memories, text.trim()]);
    }
  };

  const handleDeleteMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const handleOpenModal = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setClickCoords({ x, y });
    setSelectedMemoryIndex(index);
    setEditText(memories[index]);
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedMemoryIndex(null);
      setIsClosing(false);
    }, 280); // matches CSS close animation duration (280ms)
  };

  const handleSaveEdit = () => {
    if (selectedMemoryIndex !== null && editText.trim()) {
      const updated = [...memories];
      updated[selectedMemoryIndex] = editText.trim();
      setMemories(updated);
      setIsEditing(false);
    }
  };

  const handleDeleteFromModal = () => {
    if (selectedMemoryIndex !== null) {
      handleDeleteMemory(selectedMemoryIndex);
      handleCloseModal();
    }
  };

  return (
    <aside className={`supernova-right-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="right-panel-container">
      {/* Panel Header */}
      <RightPanelHeader isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />

      {/* Tabs */}
      <PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="panel-content">
        <div 
          className="panel-content-slider" 
          style={{ transform: `translate3d(${activeTab === 'tools' ? '0%' : '-50%'}, 0, 0)` }}
        >
          <div className="slide-pane tools-tab-content">
            <p className="tools-description">
              Research Memory is the collection of memories of what the AI has remembered.
            </p>

            <div className="memory-section-header">
              <button className="add-memory-btn" id="btn-add-memory" onClick={handleAddMemory}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Memory</span>
              </button>
            </div>

            {memories.length === 0 ? (
              <div className="memory-empty-state">
                <svg viewBox="0 0 24 24" width="36" height="36" className="empty-memory-svg" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                  <path d="M12 5v14" />
                  <path d="M12 12h5" />
                  <path d="M12 12H7" />
                </svg>
                <p className="memory-empty-text">No research memories yet</p>
              </div>
            ) : (
              <div className="memory-list">
                {memories.map((memory, index) => (
                  <div key={index} className="memory-item" onClick={(e) => handleOpenModal(index, e)}>
                    <p className="memory-text">{memory}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="slide-pane files-tab-content">
            <p className="files-empty-text">No uploaded files yet. Attach files in the composer to view them here.</p>
          </div>
        </div>
      </div>

      {selectedMemoryIndex !== null && (
        <div 
          className={`memory-modal-overlay ${isClosing ? 'closing' : ''}`} 
          onClick={handleCloseModal}
          style={{
            '--click-x': clickCoords ? `${clickCoords.x}px` : '50%',
            '--click-y': clickCoords ? `${clickCoords.y}px` : '50%'
          } as React.CSSProperties}
        >
          <div 
            className="memory-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Right Close Button */}
            <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-content-area">
              <span className="modal-label">Research Memory</span>
              <div className="modal-memory-dashed-box">
                {isEditing ? (
                  <textarea 
                    className="modal-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Edit research memory..."
                    autoFocus
                  />
                ) : (
                  <p className="modal-memory-text">{memories[selectedMemoryIndex]}</p>
                )}
              </div>
            </div>

            {/* Bottom Right Actions */}
            <div className="modal-actions-row">
              {isEditing ? (
                <>
                  <button className="flat-action-btn secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="flat-action-btn primary" onClick={handleSaveEdit}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button className="flat-action-btn primary" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                  <button className="flat-action-btn danger" onClick={handleDeleteFromModal}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

