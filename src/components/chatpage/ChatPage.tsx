import { useState } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { ChatWorkspace } from './chat/ChatWorkspace';
import { RightSidebar } from './rightsidebar/RightSidebar';
import './ChatPage.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
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

  const handleNewChat = () => {
    setActiveChatId(null);
  };

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const getAIResponse = (prompt: string): string => {
      const p = prompt.toLowerCase();
      if (p.includes('muon') || p.includes('g-2') || p.includes('anomaly')) {
        return "Based on the recent Fermilab Muon g-2 anomaly preprints, the observed deviation from the Standard Model prediction stands at 5.1σ. This anomaly strongly hints at new physics beyond the Standard Model (BSM). Possible solutions involve light, weakly coupled new bosons (like a dark photon or a dark Z' mediator) or supersymmetric particles (supersymmetric loop corrections with sleptons and charginos) that modify the muon's anomalous magnetic moment.";
      }
      if (p.includes('topological') || p.includes('phase') || p.includes('transition')) {
        return "Topological phase transitions, characterized by the Berezinskii-Kosterlitz-Thouless (BKT) mechanism, do not involve traditional symmetry-breaking patterns described by Landau theory. Instead, they are defined by the binding and unbinding of vortex-antivortex pairs. In topological insulators, transitions are characterized by bulk gap closing and changes in topological invariants, such as the Chern number or Z2 invariant.";
      }
      if (p.includes('dark matter') || p.includes('coupling') || p.includes('dark')) {
        return "For dark matter candidate couplings, constraints from direct detection experiments like LZ and XENONnT place bounds on the spin-independent WIMP-nucleon cross-section. Vector-portal and scalar-portal models with dark sector couplings are heavily constrained, forcing any viable sub-GeV dark matter models to reside in narrow parameter spaces with extremely suppressed coupling constants or specific inelastic scattering pathways.";
      }
      
      const genericResponses = [
        "That is a deep question in theoretical physics. Based on recent literature in INSPIRE and arXiv, this scenario involves higher-order loop corrections that must be regularized. Let's analyze the effective field theory (EFT) coupling constants to determine if they remain perturbative at this energy scale.",
        "This is highly relevant to quantum gravity and holographic dualities. In the context of AdS/CFT, your query maps to local operators on the boundary CFT. This suggests that the vacuum expectation value is topologically protected against thermal fluctuations.",
        "To analyze this physics paper's findings, we should look at the experimental constraints. The current collision energy at the LHC (13.6 TeV) limits the production cross-section. Thus, any new heavy resonance would require high-luminosity runs (HL-LHC) to resolve from the Standard Model background."
      ];
      return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    };

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: promptText
    };

    const aiMessage: Message = {
      id: 'msg_ai_' + (Date.now() + 1),
      sender: 'ai',
      text: getAIResponse(promptText)
    };

    if (activeChatId === null) {
      const newChatId = 'chat_' + Date.now();
      const chatName = promptText.length > 35 ? promptText.slice(0, 35) + '...' : promptText;
      const newChat: Chat = {
        id: newChatId,
        name: chatName,
        messages: [userMessage, aiMessage]
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChatId);
    } else {
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage, aiMessage]
          };
        }
        return chat;
      }));
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  return (
    <div className="supernova-chat-page" id="supernova-chat-page-root">
      {/* 3-Pane Layout */}
      <Sidebar 
        isCollapsed={isLeftSidebarCollapsed} 
        onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
        chats={chats.map(c => ({ id: c.id, name: c.name }))}
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
      />
    </div>
  );
}
export default ChatPage;
