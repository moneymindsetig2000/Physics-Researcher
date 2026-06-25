import { Header } from "./components/Header"
import { HeroContent } from "./components/HeroContent"
import { Features } from "./components/Features"
import { Comparison } from "./components/Comparison"
import { WorkspacePreview } from "./components/WorkspacePreview"
import { ResearchSources } from "./components/ResearchSources"
import { DesignedForPhysics } from "./components/DesignedForPhysics"
import { CTASection } from "./components/CTASection"
import { Footer } from "./components/Footer"

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

        {/* Research Sources Section */}
        <ResearchSources />

        {/* Designed For Physics Research Section */}
        <DesignedForPhysics />

        {/* Final CTA Section */}
        <CTASection />

        {/* Footer Section */}
        <Footer />
      </div>
    </>
  )
}

export default App
