import { useState } from 'react';
import { createPortal } from 'react-dom';
import { RightPanelHeader } from './ui/RightPanelHeader';
import { PanelTabs } from './ui/PanelTabs';
import type { MemoryRecord } from '../../../utils/ai/types';
import { embedText } from '../../../utils/ai/gemini';
import './RightSidebar.css';

interface RightSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  memories: MemoryRecord[];
  onUpdateMemories: (updated: MemoryRecord[]) => void;
}

export function RightSidebar({ 
  isCollapsed, 
  onToggleCollapse, 
  memories, 
  onUpdateMemories 
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'files'>('tools');
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddMemory = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setClickCoords({ x, y });
    setNewMemoryText('');
    setIsAddingMemory(true);
  };

  const handleCloseAddModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAddingMemory(false);
      setIsClosing(false);
    }, 280); // matches CSS close animation duration (280ms)
  };

  const handleSaveNewMemory = async () => {
    if (!newMemoryText.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const vector = await embedText(newMemoryText.trim(), "RETRIEVAL_DOCUMENT");
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const newRecord: MemoryRecord = {
        id: "mem_manual_" + randomSuffix,
        title: newMemoryText.trim().length > 30 ? newMemoryText.trim().slice(0, 30) + "..." : newMemoryText.trim(),
        description: "Manually logged memory.",
        category: "User Preference",
        memory: newMemoryText.trim(),
        importance: 5,
        createdAt: Date.now(),
        embedding: vector
      };
      onUpdateMemories([...memories, newRecord]);
      handleCloseAddModal();
    } catch (err) {
      console.error("Failed to generate embedding for manual memory:", err);
      alert("Embedding generation failed. Check API key or connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemory = (index: number) => {
    onUpdateMemories(memories.filter((_, i) => i !== index));
  };

  const handleOpenModal = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setClickCoords({ x, y });
    setSelectedMemoryIndex(index);
    setEditText(memories[index]?.memory || '');
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedMemoryIndex(null);
      setIsClosing(false);
    }, 280); // matches CSS close animation duration (280ms)
  };

  const handleSaveEdit = async () => {
    if (selectedMemoryIndex !== null && editText.trim() && !isSaving) {
      setIsSaving(true);
      try {
        const vector = await embedText(editText.trim(), "RETRIEVAL_DOCUMENT");
        const updated = [...memories];
        updated[selectedMemoryIndex] = {
          ...updated[selectedMemoryIndex],
          title: editText.trim().length > 30 ? editText.trim().slice(0, 30) + "..." : editText.trim(),
          memory: editText.trim(),
          embedding: vector
        };
        onUpdateMemories(updated);
        setIsEditing(false);
      } catch (err) {
        console.error("Failed to generate embedding for updated memory:", err);
        alert("Embedding generation failed. Check API key or connection.");
      } finally {
        setIsSaving(false);
      }
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
                <span className="tooltip">Save a new research memory context to active workspace.</span>
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
                  <div key={memory.id} className="memory-item" onClick={(e) => handleOpenModal(index, e)}>
                    <p className="memory-text">{memory.memory}</p>
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

      {selectedMemoryIndex !== null && createPortal(
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
                    disabled={isSaving}
                    autoFocus
                  />
                ) : (
                  <p className="modal-memory-text">{memories[selectedMemoryIndex]?.memory}</p>
                )}
              </div>
            </div>

            {/* Bottom Right Actions */}
            <div className="modal-actions-row">
              {isEditing ? (
                <>
                  <button className="flat-action-btn secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </button>
                  <button className="flat-action-btn primary" onClick={handleSaveEdit} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
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
        </div>,
        document.body
      )}

      {isAddingMemory && createPortal(
        <div 
          className={`memory-modal-overlay ${isClosing ? 'closing' : ''}`} 
          onClick={handleCloseAddModal}
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
            <button className="modal-close-btn" onClick={handleCloseAddModal} aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-content-area">
              <span className="modal-label">Research Memory</span>
              <div className="modal-memory-dashed-box">
                <textarea 
                  className="modal-textarea"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Enter new research memory..."
                  disabled={isSaving}
                  autoFocus
                />
              </div>
            </div>

            {/* Bottom Right Actions */}
            <div className="modal-actions-row">
              <button className="flat-action-btn secondary" onClick={handleCloseAddModal} disabled={isSaving}>
                Cancel
              </button>
              <button className="flat-action-btn primary" onClick={handleSaveNewMemory} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}

export default RightSidebar;
