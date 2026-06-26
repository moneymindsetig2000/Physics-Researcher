interface ActiveToolsPillsProps {
  onRemoveTool?: (toolKey: string) => void;
}

export function ActiveToolsPills({ onRemoveTool }: ActiveToolsPillsProps) {
  return (
    <div className="active-tools-row" id="active-tools">
      <div className="tool-pill active" id="pill-python">
        <span className="tool-pill-icon">⚡</span>
        <span className="tool-pill-name">Python Runner</span>
        <button 
          className="tool-pill-close" 
          aria-label="Disable Python Runner"
          onClick={() => onRemoveTool?.('pythonRunner')}
        >
          ×
        </button>
      </div>
      <div className="tool-pill active" id="pill-calc">
        <span className="tool-pill-icon">🖩</span>
        <span className="tool-pill-name">Calculator</span>
        <button 
          className="tool-pill-close" 
          aria-label="Disable Calculator"
          onClick={() => onRemoveTool?.('calculator')}
        >
          ×
        </button>
      </div>
    </div>
  );
}
