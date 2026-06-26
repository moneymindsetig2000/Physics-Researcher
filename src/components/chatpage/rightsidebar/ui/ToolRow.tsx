interface ToolRowProps {
  id: string;
  name: string;
  desc: string;
  icon: string;
  isOn: boolean;
  onToggle: () => void;
}

export function ToolRow({ id, name, desc, icon, isOn, onToggle }: ToolRowProps) {
  return (
    <div className="tool-row" id={`row-${id}`}>
      <div className="tool-info-col">
        <div className="tool-header-row">
          <span className="tool-icon">{icon}</span>
          <span className="tool-name">{name}</span>
        </div>
        <p className="tool-desc">{desc}</p>
      </div>
      <div className="tool-toggle-col">
        <button 
          className={`toggle-switch ${isOn ? 'on' : ''}`} 
          id={`toggle-${id}`}
          onClick={onToggle}
          aria-label={`Toggle ${name}`}
        >
          <span className="toggle-slider"></span>
        </button>
      </div>
    </div>
  );
}
