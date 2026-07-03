import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MemoryRecord } from '../../../../utils/ai/types';
import './DataTab.css';

interface DataTabProps {
  memories: MemoryRecord[];
  onUpdateMemories: (updated: MemoryRecord[]) => void;
  onClearAllChats: () => void;
}

export function DataTab({ memories, onUpdateMemories, onClearAllChats }: DataTabProps) {
  // Confirmation Modals State
  const [isDeleteMemoriesOpen, setIsDeleteMemoriesOpen] = useState(false);
  const [isClearChatsOpen, setIsClearChatsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Specific Memory Edit/Delete Modal State (matches RightSidebar popup)
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);
  const [isMemoryModalClosing, setIsMemoryModalClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenDeleteMemories = () => {
    setIsClosing(false);
    setIsDeleteMemoriesOpen(true);
  };

  const handleOpenClearChats = () => {
    setIsClosing(false);
    setIsClearChatsOpen(true);
  };

  const handleCloseDeleteMemories = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDeleteMemoriesOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleCloseClearChats = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClearChatsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleConfirmDeleteMemories = () => {
    onUpdateMemories([]);
    handleCloseDeleteMemories();
  };

  const handleConfirmClearChats = () => {
    onClearAllChats();
    handleCloseClearChats();
  };

  // Specific Memory Modal Handlers (aligned with RightSidebar workflow)
  const handleOpenMemoryModal = useCallback((memory: MemoryRecord, index: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setClickCoords({ x, y });
    setSelectedMemoryIndex(index);
    setEditText(memory.memory);
    setIsEditing(false);
  }, []);

  const handleCloseMemoryModal = useCallback(() => {
    setIsMemoryModalClosing(true);
    setTimeout(() => {
      setSelectedMemoryIndex(null);
      setIsMemoryModalClosing(false);
    }, 280);
  }, []);

  const handleSaveEdit = async () => {
    if (selectedMemoryIndex !== null && editText.trim() && !isSaving) {
      setIsSaving(true);
      try {
        const { embedText } = await import('../../../../utils/ai/gemini');
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
      const updated = memories.filter((_, i) => i !== selectedMemoryIndex);
      onUpdateMemories(updated);
      handleCloseMemoryModal();
    }
  };

  // Close popups on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDeleteMemoriesOpen) handleCloseDeleteMemories();
        if (isClearChatsOpen) handleCloseClearChats();
        if (selectedMemoryIndex !== null) handleCloseMemoryModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteMemoriesOpen, isClearChatsOpen, selectedMemoryIndex, handleCloseMemoryModal]);

  // Memoized Grid of Cards to optimize rendering performance and kill layout lag
  const memoryGrid = useMemo(() => {
    if (memories.length === 0) {
      return (
        <div className="data-empty-state">
          <svg viewBox="0 0 24 24" width="36" height="36" className="empty-state-icon-svg" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25m-2.25-2.25l2.25-2.25m-2.25 2.25l-2.25 2.25M3.75 7.5h16.5M9 3.75h6m-9 3h12" />
          </svg>
          <p className="data-empty-text">No saved research memories found in this workspace.</p>
        </div>
      );
    }

    return (
      <div className="data-memory-grid">
        {memories.map((m, idx) => {
          const textLimit = 90;
          const truncated = m.memory.length > textLimit ? m.memory.substring(0, textLimit) + '...' : m.memory;
          return (
            <div 
              key={m.id || idx} 
              className="data-memory-card" 
              title="Click to view details"
              onClick={(e) => handleOpenMemoryModal(m, idx, e)}
            >
              <div className="card-top-row">
                <span className="data-card-category">{m.category || 'Preference'}</span>
                <span className="data-card-date">{new Date(m.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <p className="data-card-text">{truncated}</p>
            </div>
          );
        })}
      </div>
    );
  }, [memories, handleOpenMemoryModal]);

  return (
    <div className="tab-pane-content fade-in" id="data-tab-pane">
      <div className="dashboard-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="tab-title">Memory & Chats</h2>
          <p className="tab-description" style={{ margin: 0 }}>Manage saved research memories and clear conversation histories.</p>
        </div>
      </div>

      <div className="data-tab-sections">
        {/* Memories Section */}
        <section className="data-section">
          <div className="data-section-header">
            <h3>Stored Memories ({memories.length})</h3>
            {memories.length > 0 && (
              <button className="settings-action-btn remove-action" onClick={handleOpenDeleteMemories}>
                Delete All Memories
              </button>
            )}
          </div>

          {memoryGrid}
        </section>

        {/* Chats Section */}
        <section className="data-section" style={{ marginTop: '2.5rem' }}>
          <div className="data-section-header">
            <h3>Conversation History</h3>
          </div>
          <div className="data-chat-control-card">
            <div className="control-card-info">
              <h4>Clear All Chats</h4>
              <p>Permanently delete all active and pinned conversations from your local workspace.</p>
            </div>
            <button className="settings-action-btn remove-action" onClick={handleOpenClearChats}>
              Clear Chats
            </button>
          </div>
        </section>
      </div>

      {/* Delete Memories Confirmation Modal */}
      {isDeleteMemoriesOpen && createPortal(
        <div className={`data-modal-wrapper ${isClosing ? 'closing' : ''}`} role="dialog" aria-modal="true">
          <div className="data-modal-backdrop" onClick={handleCloseDeleteMemories} />
          <div className="data-modal-container">
            <div className="data-modal-header">
              <div className="data-warning-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3>Delete All Memories</h3>
            </div>
            <div className="data-modal-body">
              <p>Are you sure you want to delete all stored research memories?</p>
              <p className="data-modal-warning-text">This will wipe the AI's personal context and user preference history permanently. This cannot be undone.</p>
            </div>
            <div className="data-modal-footer">
              <button className="flat-action-btn secondary" onClick={handleCloseDeleteMemories}>Cancel</button>
              <button className="flat-action-btn danger" onClick={handleConfirmDeleteMemories}>Delete All</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Clear Chats Confirmation Modal */}
      {isClearChatsOpen && createPortal(
        <div className={`data-modal-wrapper ${isClosing ? 'closing' : ''}`} role="dialog" aria-modal="true">
          <div className="data-modal-backdrop" onClick={handleCloseClearChats} />
          <div className="data-modal-container">
            <div className="data-modal-header">
              <div className="data-warning-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3>Clear All Chats</h3>
            </div>
            <div className="data-modal-body">
              <p>Are you sure you want to clear your conversation history?</p>
              <p className="data-modal-warning-text">This will delete all conversations, including pinned chats, and reset your workspace workspace window permanently. This cannot be undone.</p>
            </div>
            <div className="data-modal-footer">
              <button className="flat-action-btn secondary" onClick={handleCloseClearChats}>Cancel</button>
              <button className="flat-action-btn danger" onClick={handleConfirmClearChats}>Clear History</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Specific Memory Details & Editing Modal (same as RightSidebar popup) */}
      {selectedMemoryIndex !== null && createPortal(
        <div 
          className={`memory-modal-overlay ${isMemoryModalClosing ? 'closing' : ''}`} 
          onClick={handleCloseMemoryModal}
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
            <button className="modal-close-btn" onClick={handleCloseMemoryModal} aria-label="Close modal">
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
    </div>
  );
}
