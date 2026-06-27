interface UserProfileBarProps {
  onOpenSettings: () => void;
}

export function UserProfileBar({ onOpenSettings }: UserProfileBarProps) {
  return (
    <div className="user-profile-bar" id="sidebar-user">
      <div className="user-avatar-wrapper">
        {/* Cowboy themed character avatar */}
        <svg viewBox="0 0 100 100" className="user-avatar-svg">
          <circle cx="50" cy="50" r="46" fill="#ffe0bd" />
          {/* Cowboy Hat */}
          <path d="M15 45c5-10 15-15 35-15s30 5 35 15c5 2 10 5 10 8s-10 5-20 5c-5 0-45 0-50 0C15 58 5 56 5 53s5-6 10-8Z" fill="#a0522d" />
          <path d="M30 40c0-15 10-20 20-20s20 5 20 20H30Z" fill="#8b4513" />
          {/* Face details */}
          <circle cx="40" cy="65" r="4" fill="#333" />
          <circle cx="60" cy="65" r="4" fill="#333" />
          {/* Beard & Mustache */}
          <path d="M35 72c5 8 10 12 15 12s10-4 15-12c-5-2-25-2-30 0Z" fill="#4f3f35" />
          <path d="M38 70c4-3 8-1 12-1s8-2 12 1c-4-1-20-1-24 0Z" fill="#3a2f28" />
        </svg>
      </div>
      <span className="user-name">Raraimoon</span>
      <button 
        className="user-options-btn" 
        id="btn-user-options" 
        aria-label="User Options"
        onClick={onOpenSettings}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
        <span className="tooltip tooltip-above">Manage user account preferences and configurations.</span>
      </button>
    </div>
  );
}
