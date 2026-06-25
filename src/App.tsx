import { Header } from "./components/Header"
import { HeroContent } from "./components/HeroContent"

function App() {
  return (
    <>
      {/* Floating Pill Navigation Header */}
      <Header />

      {/* Hero Section containing background and layout */}
      <main id="hero-section">
        <HeroContent />
      </main>
    </>
  )
}

export default App
