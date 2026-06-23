import { Header } from "./components/Header"
import Grainient from "./components/Grainient"
import { HeroContent } from "./components/HeroContent"

function App() {
  return (
    <>
      {/* Floating Pill Navigation Header */}
      <Header />

      <main className="hero-container" id="hero-section">
        {/* Dynamic Background Shader */}
        <Grainient />

        {/* Hero Content Layer */}
        <HeroContent />
      </main>
    </>
  )
}

export default App
