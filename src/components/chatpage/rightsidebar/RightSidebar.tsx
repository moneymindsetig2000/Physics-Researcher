import { useState } from 'react';
import { RightPanelHeader } from './ui/RightPanelHeader';
import { PanelTabs } from './ui/PanelTabs';
import './RightSidebar.css';

interface RightSidebarProps {
  toolsState: {
    pythonRunner: boolean;
    calculator: boolean;
    webSearch: boolean;
    urlScraper: boolean;
    imageUploader: boolean;
  };
  onToggleTool: (toolKey: string) => void;
}

export function RightSidebar({ toolsState: _toolsState, onToggleTool: _onToggleTool }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'files'>('tools');
  const [memories, setMemories] = useState<string[]>([]);
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const handleAddMemory = () => {
    const text = window.prompt("Enter new research memory:");
    if (text && text.trim()) {
      setMemories([...memories, text.trim()]);
    }
  };

  const handleDeleteMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const handleOpenModal = (index: number) => {
    setSelectedMemoryIndex(index);
    setEditText(memories[index]);
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setSelectedMemoryIndex(null);
    setIsEditing(false);
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
    <aside className="supernova-right-sidebar" id="right-panel-container">
      {/* Panel Header */}
      <RightPanelHeader />

      {/* Tabs */}
      <PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="panel-content">
        {activeTab === 'tools' ? (
          <div className="tools-tab-content">
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
                  <div key={index} className="memory-item" onClick={() => handleOpenModal(index)}>
                    <p className="memory-text">{memory}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="files-tab-content">
            <p className="files-empty-text">No uploaded files yet. Attach files in the composer to view them here.</p>
          </div>
        )}
      </div>

      {selectedMemoryIndex !== null && (
        <div className="memory-modal-overlay" onClick={handleCloseModal}>
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
              <span className="modal-label">Research Insight</span>
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

