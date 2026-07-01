import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { ChatWorkspace } from './chat/ChatWorkspace';
import { RightSidebar } from './rightsidebar/RightSidebar';
import type { MemoryRecord, TraceRecord } from '../../utils/ai/types';
import { runQueryPipelineStream, embedText } from '../../utils/ai/gemini';
import { getInitialSeedMemories } from '../../utils/ai/seedData';
import './ChatPage.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  thought?: string;
  trace?: TraceRecord;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

export function ChatPage() {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);

  // 1. Initial hydration on mount
  useEffect(() => {
    // Load memories
    const storedMemories = localStorage.getItem('physica_ai_memories');
    let loadedMemories: MemoryRecord[] = [];
    if (storedMemories) {
      try {
        loadedMemories = JSON.parse(storedMemories);
      } catch (e) {
        console.error("Failed to parse stored memories", e);
      }
    }
    if (loadedMemories.length === 0) {
      loadedMemories = getInitialSeedMemories();
      localStorage.setItem('physica_ai_memories', JSON.stringify(loadedMemories));
    }
    setMemories(loadedMemories);

    // Load chat logs
    const storedChats = localStorage.getItem('physica_ai_chats');
    if (storedChats) {
      try {
        const parsedChats = JSON.parse(storedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          setActiveChatId(parsedChats[0].id);
        }
      } catch (e) {
        console.error("Failed to parse stored chats", e);
      }
    }
  }, []);

  // Persist chats on changes
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('physica_ai_chats', JSON.stringify(chats));
    }
  }, [chats]);

  // 2. Auto-Embedding Effect for Seed Memories
  useEffect(() => {
    if (memories.length === 0) return;
    const needsEmbedding = memories.some(m => !m.embedding || m.embedding.length === 0);

    if (needsEmbedding) {
      const processSeedEmbeddings = async () => {
        try {
          const updated = [...memories];
          let changed = false;
          for (let i = 0; i < updated.length; i++) {
            const mem = updated[i];
            if (!mem.embedding || mem.embedding.length === 0) {
              const vector = await embedText(mem.memory, "RETRIEVAL_DOCUMENT");
              updated[i] = {
                ...mem,
                embedding: vector
              };
              changed = true;
            }
          }
          if (changed) {
            setMemories(updated);
            localStorage.setItem('physica_ai_memories', JSON.stringify(updated));
          }
        } catch (err) {
          console.error("Failed to generate seed embeddings:", err);
        }
      };
      processSeedEmbeddings();
    }
  }, [memories]);

  const handleNewChat = () => {
    setActiveChatId(null);
  };

  const handleSendPrompt = async (promptText: string, mode: 'fast' | 'thinking' | 'deep') => {
    if (!promptText.trim()) return;

    // Extract past conversation history before state update
    const activeChat = chats.find(c => c.id === activeChatId);
    const historyMessages = activeChat ? activeChat.messages : [];
    const chatHistory = historyMessages.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: promptText
    };

    const aiMsgId = 'msg_ai_' + (Date.now() + 1);
    const placeholderMessage: Message = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      thought: 'Evaluating memory bank and initializing reasoning stream...'
    };

    let currentChatId = activeChatId;
    if (currentChatId === null) {
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

    try {
      // Execute the end-to-end reasoning pipeline with streaming, passing conversation history context
      const result = await runQueryPipelineStream(
        promptText,
        memories,
        mode,
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
                      thought: chunk.thought
                    };
                  }
                  return msg;
                })
              };
            }
            return chat;
          }));
        },
        chatHistory
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
                  trace: result.trace
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
    } catch (err) {
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
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const sidebarChats = useMemo(() => {
    return chats.map(c => ({ id: c.id, name: c.name }));
  }, [chats.map(c => `${c.id}:${c.name}`).join(',')]);

  return (
    <div className="supernova-chat-page" id="supernova-chat-page-root">
      {/* 3-Pane Layout */}
      <Sidebar 
        isCollapsed={isLeftSidebarCollapsed} 
        onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
        chats={sidebarChats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
      />
      <ChatWorkspace 
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onToggleRightSidebar={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        onToggleLeftSidebar={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
        activeChat={activeChat}
        onSendPrompt={handleSendPrompt}
      />
      <RightSidebar 
        isCollapsed={isRightSidebarCollapsed} 
        onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)} 
        memories={memories}
        onUpdateMemories={(updated) => {
          setMemories(updated);
          localStorage.setItem('physica_ai_memories', JSON.stringify(updated));
        }}
      />
    </div>
  );
}
export default ChatPage;
