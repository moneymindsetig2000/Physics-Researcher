import { Header } from "./components/Header"
import { HeroContent } from "./components/HeroContent"
import { Features } from "./components/Features"
import { Comparison } from "./components/Comparison"
import { WorkspacePreview } from "./components/WorkspacePreview"

function App() {
  return (
    <>
      {/* Floating Pill Navigation Header */}
      <Header />

      {/* Scrollable content container */}
      <div className="scroll-content-flow">
        {/* Hero Section containing background and layout */}
        <main id="hero-section">
          <HeroContent />
        </main>

        {/* Features Section */}
        <Features />

        {/* Comparison/Benchmarks Section */}
        <Comparison />

        {/* Research Workspace Preview Section */}
        <WorkspacePreview />
      </div>
    </>
  )
}

export default App
