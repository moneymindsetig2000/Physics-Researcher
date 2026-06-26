import { useState } from 'react';
import { RightPanelHeader } from './ui/RightPanelHeader';
import { PanelTabs } from './ui/PanelTabs';
import { ToolRow } from './ui/ToolRow';
import './RightSidebar.css';

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<'tools' | 'files'>('tools');
  const [toolsState, setToolsState] = useState({
    pythonRunner: true,
    calculator: true,
    webSearch: false,
    urlScraper: false
  });

  const toggleTool = (toolKey: keyof typeof toolsState) => {
    setToolsState(prev => ({
      ...prev,
      [toolKey]: !prev[toolKey]
    }));
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
              Tools are external systems that Command R+ will use to determine its actions or execute relevant programs.
            </p>

            <span className="tools-section-label">Base Tools</span>

            <div className="tools-list" id="base-tools-list">
              <ToolRow
                id="python"
                name="Python Runner"
                desc="Executes and generates code in a secure sandbox."
                icon="⚡"
                isOn={toolsState.pythonRunner}
                onToggle={() => toggleTool('pythonRunner')}
              />
              <ToolRow
                id="calc"
                name="Calculator"
                desc="Performs calculations"
                icon="🖩"
                isOn={toolsState.calculator}
                onToggle={() => toggleTool('calculator')}
              />
              <ToolRow
                id="search"
                name="Web Search"
                desc="Searches the web"
                icon="🌐"
                isOn={toolsState.webSearch}
                onToggle={() => toggleTool('webSearch')}
              />
              <ToolRow
                id="scraper"
                name="URL Scraper"
                desc="Extracts information from a URL"
                icon="🕷️"
                isOn={toolsState.urlScraper}
                onToggle={() => toggleTool('urlScraper')}
              />
            </div>
          </div>
        ) : (
          <div className="files-tab-content">
            <p className="files-empty-text">No uploaded files yet. Attach files in the composer to view them here.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

