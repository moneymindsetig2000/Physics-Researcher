import { Header } from "./components/Header"
import { HeroContent } from "./components/HeroContent"
import { Features } from "./components/Features"

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
      </div>
    </>
  )
}

export default App
