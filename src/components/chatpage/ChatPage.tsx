import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './sidebar/Sidebar';
import { ChatWorkspace } from './chat/ChatWorkspace';
import { RightSidebar } from './rightsidebar/RightSidebar';
import type { MemoryRecord, TraceRecord } from '../../utils/ai/types';
import { runQueryPipelineStream, embedText } from '../../utils/ai/gemini';
import { getInitialSeedMemories } from '../../utils/ai/seedData';
import { generateSummary } from '../../utils/ai/summaryGenerator';
import { NewChatDialog } from './chat/ui/NewChatDialog';
import './ChatPage.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  thought?: string;
  trace?: TraceRecord;
  images?: string[];
  pdfs?: string[];
  versions?: { text: string; responseText?: string; responseThought?: string }[];
  questionForm?: { question: string; options: string[] };
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  isPinned?: boolean;
  summary?: string | null;
}

export // Radha
function ChatPage() { // Radha

  // Radha
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>(() => {
    const stored = localStorage.getItem('physica_ai_chats');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored chats", e);
      }
    }
    return [];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const stored = localStorage.getItem('physica_ai_chats');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {
        console.error("Failed to parse stored chats", e);
      }
    }
    return null;
  });
  const [memories, setMemories] = useState<MemoryRecord[]>(() => {
    const stored = localStorage.getItem('physica_ai_memories');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse stored memories", e);
      }
    }
    const seed = getInitialSeedMemories();
    localStorage.setItem('physica_ai_memories', JSON.stringify(seed));
    return seed;
  });
  
  // Ref to track whether seed embeddings have been processed — prevents the
  // embedding useEffect from re-firing when setMemories() updates the array.
  const embeddingProcessedRef = useRef(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const pendingContextSummaryRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Persist chats on changes (runs on empty array as well to clean up localStorage)
  useEffect(() => {
    try {
      const sanitizedChats = chats.map(chat => ({
        ...chat,
        messages: chat.messages.map(msg => ({
          ...msg,
          images: msg.images,
          pdfs: msg.pdfs
        }))
      }));
      localStorage.setItem('physica_ai_chats', JSON.stringify(sanitizedChats));
    } catch (err) {
      console.warn("Could not persist chats list to localStorage due to quota limits:", err);
    }
  }, [chats]);

  // 2. Auto-Embedding Effect for Seed Memories — runs ONCE after initial load.
  // Uses a ref gate so that when setMemories() is called inside processSeedEmbeddings,
  // it does NOT re-trigger this effect (which was the infinite loop cause).
  useEffect(() => {
    if (memories.length === 0) return;
    if (embeddingProcessedRef.current) return; // gate: only run once

    const needsEmbedding = memories.some(m => !m.embedding || m.embedding.length === 0);
    if (!needsEmbedding) {
      embeddingProcessedRef.current = true;
      return;
    }

    embeddingProcessedRef.current = true; // mark before async to prevent duplicate runs

    const processSeedEmbeddings = async () => {
      try {
        const snapshot = [...memories]; // capture a snapshot, don't close over live state
        let changed = false;
        for (let i = 0; i < snapshot.length; i++) {
          const mem = snapshot[i];
          if (!mem.embedding || mem.embedding.length === 0) {
            const vector = await embedText(mem.memory, "RETRIEVAL_DOCUMENT");
            snapshot[i] = { ...mem, embedding: vector };
            changed = true;
          }
        }
        if (changed) {
          setMemories(snapshot);
          localStorage.setItem('physica_ai_memories', JSON.stringify(snapshot));
        }
      } catch (err) {
        console.error("Failed to generate seed embeddings:", err);
      }
    };
    processSeedEmbeddings();
  }, [memories.length]); // depend only on COUNT — fires on initial load only, not on content update

  const handleNewChat = useCallback(() => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (activeChat && activeChat.messages.length > 0) {
      setShowNewChatDialog(true);
    } else {
      setActiveChatId(null);
    }
  }, [chats, activeChatId]);

  const handleContinueWithContext = useCallback(() => {
    const activeChat = chats.find(c => c.id === activeChatId);
    pendingContextSummaryRef.current = activeChat?.summary ?? null;
    setShowNewChatDialog(false);
    setActiveChatId(null);
  }, [chats, activeChatId]);

  const handleFreshStart = useCallback(() => {
    pendingContextSummaryRef.current = null;
    setShowNewChatDialog(false);
    setActiveChatId(null);
  }, []);
  const handleSendPrompt = useCallback(async (
    promptText: string, 
    attachedImages?: string[],
    attachedPdfs?: string[]
  ) => {
    if (!promptText.trim() && (!attachedImages || attachedImages.length === 0) && (!attachedPdfs || attachedPdfs.length === 0)) return;

    // Extract past conversation history before state update
    const activeChat = chats.find(c => c.id === activeChatId);
    const existingSummary = activeChat?.summary ?? null;
    const historyMessages = activeChat ? activeChat.messages : [];
    const chatHistory = historyMessages.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: promptText,
      images: attachedImages,
      pdfs: attachedPdfs
    };

    const aiMsgId = 'msg_ai_' + (Date.now() + 1);
    const placeholderMessage: Message = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      thought: undefined
    };

    let currentChatId = activeChatId;
    if (currentChatId === null) {
      const contextSummary = pendingContextSummaryRef.current;
      pendingContextSummaryRef.current = null;
      const firstPrompt = contextSummary
        ? `[Previous Research Context]\n${contextSummary}\n\n---\n\n${promptText}`
        : promptText;
      userMessage.text = firstPrompt;
      currentChatId = 'chat_' + Date.now();
      const chatName = promptText.length > 35 ? promptText.slice(0, 35) + '...' : promptText;
      const newChat: Chat = {
        id: currentChatId,
        name: chatName,
        messages: [userMessage, placeholderMessage]
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(currentChatId);
    } else {
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage, placeholderMessage]
          };
        }
        return chat;
      }));
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);

    try {
      // Parse data URL arrays to raw objects (mimeType, base64Data) for the Gemini API
      const parsedImages = attachedImages?.map(url => {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        return match ? { mimeType: match[1], base64Data: match[2] } : null;
      }).filter((img): img is { mimeType: string; base64Data: string } => img !== null);

      const parsedPdfs = attachedPdfs?.map(url => {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        return match ? { mimeType: match[1], base64Data: match[2] } : null;
      }).filter((pdf): pdf is { mimeType: string; base64Data: string } => pdf !== null);

      // Execute the end-to-end reasoning pipeline with streaming, passing conversation history context and image/document payloads
      const result = await runQueryPipelineStream(
        userMessage.text,
        memories,
        (chunk) => {
          setChats(prev => prev.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: chat.messages.map(msg => {
                  if (msg.id === aiMsgId) {
                    return {
                      ...msg,
                      text: chunk.text,
                      thought: chunk.thought,
                      questionForm: chunk.questionForm
                    };
                  }
                  return msg;
                })
              };
            }
            return chat;
          }));
        },
        chatHistory,
        parsedImages,
        parsedPdfs,
        controller.signal
      );

      // Once streaming fully completes, attach final trace data and sync states
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => {
              if (msg.id === aiMsgId) {
                return {
                  ...msg,
                  text: result.replyText,
                  thought: msg.thought,
                  trace: result.trace,
                  questionForm: result.questionForm
                };
              }
              return msg;
            })
          };
        }
        return chat;
      }));

      // Synchronize memory deletions and additions seamlessly without full page refresh
      let activeMemories = memories;
      if (result.deletedMemoryId) {
        activeMemories = activeMemories.filter(m => m.id !== result.deletedMemoryId);
        setMemories(activeMemories);
        localStorage.setItem('physica_ai_memories', JSON.stringify(activeMemories));
      }
      if (result.newMemoryCreated) {
        activeMemories = [...activeMemories, result.newMemoryCreated];
        setMemories(activeMemories);
        localStorage.setItem('physica_ai_memories', JSON.stringify(activeMemories));
      }

      // Fire-and-forget summary generation — merges the newest exchange into the existing summary
      if (currentChatId) {
        const newExchange = [
          { sender: 'user' as const, text: promptText },
          { sender: 'ai' as const, text: result.replyText }
        ];
        setIsSummaryGenerating(true);
        generateSummary(newExchange, undefined, existingSummary).then(summary => {
          if (summary) {
            setChats(prev => prev.map(chat => {
              if (chat.id === currentChatId) {
                return { ...chat, summary };
              }
              return chat;
            }));
          }
        }).catch(() => {}).finally(() => {
          setIsSummaryGenerating(false);
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('AbortError')) {
        console.log("Generation aborted by user.");
        setChats(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => {
                if (msg.id === aiMsgId) {
                  const baseText = msg.text ? msg.text.trim() : "";
                  const stopText = baseText 
                    ? `${baseText}\n\n*Generation stopped by user.*` 
                    : "*Generation stopped by user.*";
                  return {
                    ...msg,
                    text: stopText,
                    thought: msg.thought
                  };
                }
                return msg;
              })
            };
          }
          return chat;
        }));
        return;
      }
      console.error("Pipeline query execution failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => {
              if (msg.id === aiMsgId) {
                return {
                  ...msg,
                  text: `⚠️ **Pipeline Execution Failed**\n\nError details:\n\`\`\`text\n${errMsg}\n\`\`\``,
                  thought: undefined
                };
              }
              return msg;
            })
          };
        }
        return chat;
      }));
    } finally {
      setIsGenerating(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [activeChatId, chats, memories]);

  const handleEditPrompt = useCallback(async (
    userMsgId: string,
    newText: string,
    aiMsgId: string
  ) => {
    if (!newText.trim()) return;

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const existingSummary = activeChat?.summary ?? null;

    // Extract chat history excluding the messages being edited
    const msgIndex = activeChat.messages.findIndex(m => m.id === userMsgId);
    const historyMessages = activeChat.messages.slice(0, msgIndex).map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    // Save old version and update the user + AI messages
    const aiMsg = activeChat.messages.find(m => m.id === aiMsgId);

    setChats(prev => prev.map(chat => {
      if (chat.id !== activeChatId) return chat;
      return {
        ...chat,
        messages: chat.messages.map(msg => {
          if (msg.id === userMsgId) {
            const existingVersions = msg.versions || [];
            return {
              ...msg,
              text: newText,
              versions: [
                ...existingVersions,
                { text: msg.text, responseText: aiMsg?.text, responseThought: aiMsg?.thought }
              ]
            };
          }
          if (msg.id === aiMsgId) {
            return { ...msg, text: '', thought: undefined, trace: undefined };
          }
          return msg;
        })
      };
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);

    try {
      const result = await runQueryPipelineStream(
        newText,
        memories,
        (chunk) => {
          setChats(prev => prev.map(chat => {
            if (chat.id !== activeChatId) return chat;
            return {
              ...chat,
              messages: chat.messages.map(msg => {
                if (msg.id === aiMsgId) {
                  return { ...msg, text: chunk.text, thought: chunk.thought, questionForm: chunk.questionForm };
                }
                return msg;
              })
            };
          }));
        },
        historyMessages,
        undefined,
        undefined,
        controller.signal
      );

      setChats(prev => prev.map(chat => {
        if (chat.id !== activeChatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === aiMsgId) {
              return { ...msg, text: result.replyText, thought: msg.thought, trace: result.trace, questionForm: result.questionForm };
            }
            return msg;
          })
        };
      }));

      let activeMemories = memories;
      if (result.deletedMemoryId) {
        activeMemories = activeMemories.filter(m => m.id !== result.deletedMemoryId);
        setMemories(activeMemories);
        localStorage.setItem('physica_ai_memories', JSON.stringify(activeMemories));
      }
      if (result.newMemoryCreated) {
        activeMemories = [...activeMemories, result.newMemoryCreated];
        setMemories(activeMemories);
        localStorage.setItem('physica_ai_memories', JSON.stringify(activeMemories));
      }

      if (activeChatId) {
        const newExchange = [
          { sender: 'user' as const, text: newText },
          { sender: 'ai' as const, text: result.replyText }
        ];
        setIsSummaryGenerating(true);
        generateSummary(newExchange, undefined, existingSummary).then(summary => {
          if (summary) {
            setChats(prev => prev.map(chat => {
              if (chat.id === activeChatId) {
                return { ...chat, summary };
              }
              return chat;
            }));
          }
        }).catch(() => {}).finally(() => {
          setIsSummaryGenerating(false);
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('AbortError')) {
        setChats(prev => prev.map(chat => {
          if (chat.id !== activeChatId) return chat;
          return {
            ...chat,
            messages: chat.messages.map(msg => {
              if (msg.id === aiMsgId) {
                const baseText = msg.text ? msg.text.trim() : '';
                return {
                  ...msg,
                  text: baseText ? `${baseText}\n\n*Generation stopped by user.*` : '*Generation stopped by user.*'
                };
              }
              return msg;
            })
          };
        }));
        return;
      }
      console.error('Edit prompt execution failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setChats(prev => prev.map(chat => {
        if (chat.id !== activeChatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === aiMsgId) {
              return { ...msg, text: `⚠️ **Edit Execution Failed**\n\nError details:\n\`\`\`text\n${errMsg}\n\`\`\`` };
            }
            return msg;
          })
        };
      }));
    } finally {
      setIsGenerating(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [activeChatId, chats, memories]);

  const activeChat = useMemo(
    () => chats.find(c => c.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const sidebarChats = useMemo(() => {
    return chats.map(c => ({ id: c.id, name: c.name, isPinned: c.isPinned }));
  }, [chats]);

  const handleDeleteChat = useCallback((id: string) => {
    setChats(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeChatId === id) {
        if (updated.length > 0) {
          setActiveChatId(updated[0].id);
        } else {
          setActiveChatId(null);
        }
      }
      return updated;
    });
  }, [activeChatId]);

  const handleTogglePinChat = useCallback((id: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return {
          ...chat,
          isPinned: !chat.isPinned
        };
      }
      return chat;
    }));
  }, []);

  const handleUpdateMemories = useCallback((updated: MemoryRecord[]) => {
    setMemories(updated);
    localStorage.setItem('physica_ai_memories', JSON.stringify(updated));
  }, []);

  const handleClearAllChats = useCallback(() => {
    setChats([]);
    setActiveChatId(null);
    localStorage.setItem('physica_ai_chats', JSON.stringify([]));
  }, []);

  const handleToggleRightSidebar = useCallback(() => {
    setIsRightSidebarCollapsed(prev => !prev);
  }, []);

  const handleToggleLeftSidebar = useCallback(() => {
    setIsLeftSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className="supernova-chat-page" id="supernova-chat-page-root">
      {/* 3-Pane Layout */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexShrink: 0 }}
      >
        <Sidebar 
          isCollapsed={isLeftSidebarCollapsed} 
          onToggleCollapse={handleToggleLeftSidebar}
          chats={sidebarChats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onTogglePinChat={handleTogglePinChat}
          memories={memories}
          onUpdateMemories={handleUpdateMemories}
          onClearAllChats={handleClearAllChats}
        />
      </motion.div>
      <ChatWorkspace 
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onToggleRightSidebar={handleToggleRightSidebar}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        onToggleLeftSidebar={handleToggleLeftSidebar}
        activeChat={activeChat}
        onSendPrompt={handleSendPrompt}
        onEditPrompt={handleEditPrompt}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
        summary={activeChat?.summary}
        isSummaryGenerating={isSummaryGenerating}
      />
      <motion.div
        initial={{ x: 280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexShrink: 0 }}
      >
        <RightSidebar 
          isCollapsed={isRightSidebarCollapsed} 
          onToggleCollapse={handleToggleRightSidebar} 
          memories={memories}
          onUpdateMemories={handleUpdateMemories}
          chatMessages={activeChat?.messages || []}
        />
      </motion.div>

      {/* New Chat Dialog */}
      <NewChatDialog
        isOpen={showNewChatDialog}
        onContinueWithContext={handleContinueWithContext}
        onFreshStart={handleFreshStart}
        onDismiss={() => setShowNewChatDialog(false)}
      />
    </div>
  );
}
export default ChatPage;
