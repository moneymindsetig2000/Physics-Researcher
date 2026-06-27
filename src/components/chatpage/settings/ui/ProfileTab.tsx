export function ProfileTab() {
  return (
    <div className="tab-pane-content fade-in">
      <h2 className="tab-title">My Profile</h2>
      <p className="tab-description">Manage academic metadata, avatar themes, and active workspace preferences.</p>
      <div className="profile-settings">
        <div className="profile-details-row">
          <div className="profile-avatar-box">
            <svg viewBox="0 0 100 100" width="80" height="80">
              <circle cx="50" cy="50" r="46" fill="#ffe0bd" />
              <path d="M15 45c5-10 15-15 35-15s30 5 35 15c5 2 10 5 10 8s-10 5-20 5c-5 0-45 0-50 0C15 58 5 56 5 53s5-6 10-8Z" fill="#a0522d" />
              <path d="M30 40c0-15 10-20 20-20s20 5 20 20H30Z" fill="#8b4513" />
              <circle cx="40" cy="65" r="4" fill="#333" />
              <circle cx="60" cy="65" r="4" fill="#333" />
              <path d="M35 72c5 8 10 12 15 12s10-4 15-12c-5-2-25-2-30 0Z" fill="#4f3f35" />
              <path d="M38 70c4-3 8-1 12-1s8-2 12 1c-4-1-20-1-24 0Z" fill="#3a2f28" />
            </svg>
          </div>
          <div className="profile-meta-info">
            <h3>Raraimoon</h3>
            <p>Role: Lead Academic Researcher</p>
            <p>Active Project: Physica-AI Core</p>
          </div>
        </div>
        <div className="profile-form">
          <div className="form-group">
            <label>Academic Institution</label>
            <input type="text" defaultValue="CERN - European Organization for Nuclear Research" className="profile-input" />
          </div>
          <div className="form-group">
            <label>arXiv Author Identifier</label>
            <input type="text" defaultValue="raraimoon.cern" className="profile-input" />
          </div>
        </div>
      </div>
    </div>
  );
}
