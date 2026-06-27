export function TeamsTab() {
  return (
    <div className="tab-pane-content fade-in">
      <h2 className="tab-title">Team Workspace</h2>
      <p className="tab-description">Collaborate with fellow researchers on shared INSPIRE paper annotations.</p>
      <div className="team-list">
        <div className="team-header-row">
          <span>Active Members (3)</span>
          <button className="add-member-action">+ Invite Member</button>
        </div>
        <div className="team-member-item">
          <div className="member-avatar">E</div>
          <div className="member-details">
            <span className="member-name">Elena Rostova</span>
            <span className="member-role">Co-Author</span>
          </div>
        </div>
        <div className="team-member-item">
          <div className="member-avatar">M</div>
          <div className="member-details">
            <span className="member-name">Marcus Vance</span>
            <span className="member-role">Peer Reviewer</span>
          </div>
        </div>
        <div className="team-member-item">
          <div className="member-avatar flex-avatar">R</div>
          <div className="member-details">
            <span className="member-name">Raraimoon (You)</span>
            <span className="member-role">Workspace Owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
