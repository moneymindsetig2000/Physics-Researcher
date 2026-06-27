export function DocsTab() {
  return (
    <div className="tab-pane-content fade-in">
      <h2 className="tab-title">Academic Integration Docs</h2>
      <p className="tab-description">Read API documentation, parameter specifications, and citation formats.</p>
      <div className="docs-topics">
        <div className="doc-link-card">
          <h4>arXiv Metadata API Integration</h4>
          <p>Learn how to format query strings to fetch hep-ph and hep-ex preprint categories automatically.</p>
        </div>
        <div className="doc-link-card">
          <h4>INSPIRE-HEP Citation Syntax</h4>
          <p>Proper formatting guidelines for exporting bibliography files directly from Physica-AI to BibTeX.</p>
        </div>
      </div>
    </div>
  );
}
