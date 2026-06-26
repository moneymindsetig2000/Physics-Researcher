interface PanelTabsProps {
  activeTab: 'tools' | 'files';
  onTabChange: (tab: 'tools' | 'files') => void;
}

export function PanelTabs({ activeTab, onTabChange }: PanelTabsProps) {
  return (
    <div className="panel-tabs">
      <button 
        className={`panel-tab-btn ${activeTab === 'tools' ? 'active' : ''}`} 
        id="tab-tools"
        onClick={() => onTabChange('tools')}
      >
        Memory
      </button>
      <button 
        className={`panel-tab-btn ${activeTab === 'files' ? 'active' : ''}`} 
        id="tab-files"
        onClick={() => onTabChange('files')}
      >
        Files
      </button>
    </div>
  );
}
