interface ActiveToolsPillsProps {
  toolsState: {
    pythonRunner: boolean;
    calculator: boolean;
    imageUploader: boolean;
    [key: string]: boolean;
  };
  onRemoveTool?: (toolKey: string) => void;
}

export function ActiveToolsPills({ toolsState, onRemoveTool }: ActiveToolsPillsProps) {
  return (
    <div className="active-tools-row" id="active-tools">
      {toolsState.pythonRunner && (
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
      )}
      {toolsState.calculator && (
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
      )}
      {toolsState.imageUploader && (
        <div className="tool-pill active" id="pill-image-uploader">
          <span className="tool-pill-icon">🖼️</span>
          <span className="tool-pill-name">Image Uploader</span>
          <button 
            className="tool-pill-close" 
            aria-label="Disable Image Uploader"
            onClick={() => onRemoveTool?.('imageUploader')}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
