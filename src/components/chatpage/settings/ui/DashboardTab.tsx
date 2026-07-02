import { useState, useEffect } from 'react';
import { embedText, isApiKeyConfigured } from '../../../../utils/ai/gemini';

interface DashboardTabProps {
  isOpen: boolean;
}

type ConnectionStateType = 'Checking...' | '200 OK' | 'Offline' | 'Key Missing';

// Module-level caches to avoid main-thread lag and API thrashing on every mount/tab switch
let cachedJessieStatus: ConnectionStateType | null = null;
let lastCheckedTime = 0;

interface StatsType {
  memoriesCount: number;
  chatsCount: number;
  allTimeMessages: number;
  allTimeWebSearches: number;
  messagesToday: number;
  tokensUsed: number;
  filesAnalyzed: number;
  webSearches: number;
  lastMemoryUpdateStr: string;
}

let cachedMemoriesStr: string | null = null;
let cachedChatsStr: string | null = null;
let cachedStats: StatsType | null = null;

export function DashboardTab({ isOpen }: DashboardTabProps) {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [jessieStatus, setJessieStatus] = useState<ConnectionStateType>(() => {
    if (cachedJessieStatus && Date.now() - lastCheckedTime < 30000) {
      return cachedJessieStatus;
    }
    return 'Checking...';
  });
  const [stats, setStats] = useState<StatsType>(() => {
    if (cachedStats) {
      return cachedStats;
    }
    return {
      memoriesCount: 0,
      chatsCount: 0,
      allTimeMessages: 0,
      allTimeWebSearches: 0,
      messagesToday: 0,
      tokensUsed: 0,
      filesAnalyzed: 0,
      webSearches: 0,
      lastMemoryUpdateStr: 'Never'
    };
  });

  const handleRefresh = () => {
    // Clear caches to force a fresh connection check and stats recalculation on refresh request
    cachedJessieStatus = null;
    lastCheckedTime = 0;
    cachedMemoriesStr = null;
    cachedChatsStr = null;
    cachedStats = null;
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Run connection test to check GenAI inference point response
    const runConnectionCheck = async () => {
      if (!isApiKeyConfigured()) {
        setJessieStatus('Key Missing');
        return;
      }

      const now = Date.now();
      if (cachedJessieStatus && (now - lastCheckedTime < 30000)) {
        setJessieStatus(cachedJessieStatus);
        return;
      }

      setJessieStatus('Checking...');

      try {
        // Lightweight embedding call pings the GenAI API to see if it returns 200 OK
        await embedText("telemetry_ping", "RETRIEVAL_QUERY");
        cachedJessieStatus = '200 OK';
        lastCheckedTime = Date.now();
        setJessieStatus('200 OK');
      } catch (err) {
        console.error("Telemetry API connection test failed:", err);
        cachedJessieStatus = 'Offline';
        lastCheckedTime = Date.now();
        setJessieStatus('Offline');
      }
    };
    runConnectionCheck();

    // Load memories and chats string representations to check cache eligibility
    const memoriesStr = localStorage.getItem('physica_ai_memories');
    const chatsStr = localStorage.getItem('physica_ai_chats');

    if (
      cachedStats &&
      cachedMemoriesStr === memoriesStr &&
      cachedChatsStr === chatsStr
    ) {
      setStats(cachedStats);
      return;
    }

    // Load memories
    let memoriesList: any[] = [];
    if (memoriesStr) {
      try {
        memoriesList = JSON.parse(memoriesStr);
      } catch (e) {
        console.error(e);
      }
    }

    // Load chats
    let chatsList: any[] = [];
    if (chatsStr) {
      try {
        chatsList = JSON.parse(chatsStr);
      } catch (e) {
        console.error(e);
      }
    }

    // Calculate messages today and other stats
    let totalMessagesToday = 0;
    let totalWebSearches = 0;
    let totalFilesAnalyzed = 0;
    let totalTokensUsed = 0;
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    let allTimeMessages = 0;
    let allTimeWebSearches = 0;
    let allTimeFilesAnalyzed = 0;

    // Parse chats to extract statistics
    chatsList.forEach((chat: any) => {
      if (chat.messages && Array.isArray(chat.messages)) {
        allTimeMessages += chat.messages.length;
        chat.messages.forEach((msg: any) => {
          // Parse timestamp from msg.id if it starts with msg_user_ or msg_ai_
          let timestamp = Date.now();
          if (msg.id) {
            const parts = msg.id.split('_');
            const lastPart = parts[parts.length - 1];
            const parsedTime = parseInt(lastPart, 10);
            if (!isNaN(parsedTime)) {
              timestamp = parsedTime;
            }
          }

          // Count messages created today
          if (timestamp >= startOfToday) {
            totalMessagesToday++;
          }

          // Search usage in traces
          if (msg.trace) {
            if (msg.trace.searchUsed) {
              allTimeWebSearches += (msg.trace.searchQueries?.length || 1);
              if (timestamp >= startOfToday) {
                totalWebSearches += (msg.trace.searchQueries?.length || 1);
              }
            }
            if (msg.trace.searchSources && Array.isArray(msg.trace.searchSources)) {
              // Count pdfs/files in search sources
              msg.trace.searchSources.forEach((src: any) => {
                if (src.uri && (src.uri.endsWith('.pdf') || src.uri.includes('arxiv.org/pdf'))) {
                  allTimeFilesAnalyzed++;
                  if (timestamp >= startOfToday) {
                    totalFilesAnalyzed++;
                  }
                }
              });
            }
          }

          // Check if message itself mentions PDF upload
          if (msg.sender === 'user' && msg.text && (msg.text.toLowerCase().includes('.pdf') || msg.text.toLowerCase().includes('attach'))) {
            allTimeFilesAnalyzed++;
            if (timestamp >= startOfToday) {
              totalFilesAnalyzed++;
            }
          }
        });
      }
    });

    // Token calculation (roughly 180 tokens per text message, more for search and PDFs)
    totalTokensUsed = totalMessagesToday * 180 + totalWebSearches * 450 + totalFilesAnalyzed * 1200;

    // Calculate last memory update string
    let lastMemoryUpdateStr = 'Never';
    if (memoriesList.length > 0) {
      const timestamps = memoriesList.map(m => m.createdAt || 0).filter(t => t > 0);
      if (timestamps.length > 0) {
        const latestTime = Math.max(...timestamps);
        const diffMs = Date.now() - latestTime;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) {
          lastMemoryUpdateStr = 'Just now';
        } else if (diffMins < 60) {
          lastMemoryUpdateStr = `${diffMins} min ago`;
        } else {
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) {
            lastMemoryUpdateStr = `${diffHours} hours ago`;
          } else {
            lastMemoryUpdateStr = `${Math.floor(diffHours / 24)} days ago`;
          }
        }
      }
    }

    const computedStats: StatsType = {
      memoriesCount: memoriesList.length,
      chatsCount: chatsList.length,
      allTimeMessages,
      allTimeWebSearches,
      messagesToday: totalMessagesToday,
      tokensUsed: totalTokensUsed,
      filesAnalyzed: totalFilesAnalyzed,
      webSearches: totalWebSearches,
      lastMemoryUpdateStr
    };

    cachedMemoriesStr = memoriesStr;
    cachedChatsStr = chatsStr;
    cachedStats = computedStats;

    setStats(computedStats);
  }, [isOpen, refreshKey]);

  // Map header indicator states
  const headerClass = jessieStatus === '200 OK' ? 'online' : jessieStatus === 'Checking...' ? 'checking' : 'offline';
  const headerLabel = jessieStatus === '200 OK' ? 'Online' : jessieStatus === 'Checking...' ? 'Checking...' : 'Offline';

  return (
    <div className="tab-pane-content fade-in" id="dashboard-tab-pane">
      <div className="dashboard-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="tab-title">Research Dashboard</h2>
          <p className="tab-description" style={{ margin: 0 }}>System telemetry and workspace academic integration analytics.</p>
        </div>
        <button 
          className="settings-action-btn secondary-action" 
          onClick={handleRefresh}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="refresh-icon" style={{ display: 'block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="settings-grid">
        {/* 1. Jessie Status Card */}
        <div className="settings-card" id="card-jessie-status">
          <h3>Jessie Status</h3>
          <div className={`status-header ${headerClass}`}>
            <span className={`status-dot ${headerClass}`}></span>
            <span>{headerLabel}</span>
          </div>
          <div className="card-details-list">
            <div className="card-detail-row">
              <span className="detail-label">Model:</span>
              <span className="detail-value">Jessie</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Reasoning Engine:</span>
              <span className="detail-value ready">Ready</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Memory Engine:</span>
              <span className="detail-value ready">Ready</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Search:</span>
              <span className="detail-value available">Available</span>
            </div>
          </div>
        </div>

        {/* 2. Memory System Card */}
        <div className="settings-card" id="card-memory-system">
          <h3>Memory System</h3>
          <div className="card-details-list" style={{ marginTop: '0.5rem' }}>
            <div className="card-detail-row">
              <span className="detail-label">Stored:</span>
              <span className="detail-value">{stats.memoriesCount}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Retrieval:</span>
              <span className="detail-value active">Active</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Auto Save:</span>
              <span className="detail-value active">Enabled</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Last Update:</span>
              <span className="detail-value">{stats.lastMemoryUpdateStr}</span>
            </div>
          </div>
        </div>

        {/* 3. API & Services Card */}
        <div className="settings-card" id="card-services">
          <h3>Services</h3>
          <div className="card-details-list" style={{ marginTop: '0.5rem' }}>
            <div className="card-detail-row">
              <span className="detail-label">Platform:</span>
              <span className="detail-value connected">● Connected</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Jessie AI:</span>
              <span className={`detail-value ${
                jessieStatus === '200 OK' ? 'connected' : 
                jessieStatus === 'Checking...' ? 'checking' : 'disconnected'
              }`}>
                ● {
                  jessieStatus === '200 OK' ? 'Connected' : 
                  jessieStatus === 'Key Missing' ? 'Key Missing' : 
                  jessieStatus === 'Offline' ? 'Offline' : 'Checking...'
                }
              </span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Memory:</span>
              <span className="detail-value connected">● Connected</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Workspace:</span>
              <span className="detail-value connected">● Connected</span>
            </div>
          </div>
        </div>

        {/* 4. Usage Summary Card */}
        <div className="settings-card" id="card-usage-summary">
          <h3>Today's Usage</h3>
          <div className="card-details-list" style={{ marginTop: '0.5rem' }}>
            <div className="card-detail-row">
              <span className="detail-label">Messages:</span>
              <span className="detail-value">{stats.messagesToday}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Tokens Used:</span>
              <span className="detail-value">{stats.tokensUsed.toLocaleString()}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Files Analyzed:</span>
              <span className="detail-value">{stats.filesAnalyzed}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Web Searches:</span>
              <span className="detail-value">{stats.webSearches}</span>
            </div>
          </div>
        </div>

        {/* 5. Workspace Stats Card */}
        <div className="settings-card" id="card-workspace-stats">
          <h3>Workspace Stats</h3>
          <div className="card-details-list" style={{ marginTop: '0.5rem' }}>
            <div className="card-detail-row">
              <span className="detail-label">Total Memories:</span>
              <span className="detail-value">{stats.memoriesCount}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Stored Chats:</span>
              <span className="detail-value">{stats.chatsCount}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">All-time Messages:</span>
              <span className="detail-value">{stats.allTimeMessages}</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Web Searches:</span>
              <span className="detail-value">{stats.allTimeWebSearches}</span>
            </div>
          </div>
        </div>

        {/* 6. Version Information Card */}
        <div className="settings-card" id="card-version-info">
          <h3>Version Info</h3>
          <div className="card-details-list" style={{ marginTop: '0.5rem' }}>
            <div className="card-detail-row">
              <span className="detail-label">Jessie Version:</span>
              <span className="detail-value">v1.0</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Memory Engine:</span>
              <span className="detail-value">v1.0</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Physica Version:</span>
              <span className="detail-value">v1.0</span>
            </div>
            <div className="card-detail-row">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">July 10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
