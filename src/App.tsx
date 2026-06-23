import { ShaderAnimation } from "./components/ShaderAnimation"

function App() {
  return (
    <main className="hero-container" id="hero-section">
      {/* Dynamic Background shader */}
      <ShaderAnimation />

      {/* Radial overlay to soften contrast */}
      <div className="hero-overlay" />

      {/* Main interactive content panel */}
      <header className="hero-content">
        <span className="hero-tag" id="intro-tag">Generative Artwork</span>
        <h1 className="hero-title" id="main-heading">
          Resonance of<br />Lines &amp; Time
        </h1>
        <p className="hero-description" id="main-description">
          A high-performance WebGL shader rendering infinite loop curves. Powered by Three.js and custom math algorithms calculations running in real-time.
        </p>
        <a 
          href="https://github.com/threejs/three.js" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hero-cta" 
          id="explore-button"
        >
          Explore WebGL
        </a>
      </header>
    </main>
  )
}

export default App
