import { Header } from "./components/landingpage/header/Header"
import { HeroContent } from "./components/landingpage/hero/HeroContent"
import { Features } from "./components/landingpage/features/Features"
import { Comparison } from "./components/landingpage/comparison/Comparison"
import { WorkspacePreview } from "./components/landingpage/workspacepreview/WorkspacePreview"
import { ResearchSources } from "./components/landingpage/researchsources/ResearchSources"
import { DesignedForPhysics } from "./components/landingpage/designedforphysics/DesignedForPhysics"
import { CTASection } from "./components/landingpage/ctasection/CTASection"
import { Footer } from "./components/landingpage/footer/Footer"

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
