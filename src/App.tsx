import { Header } from "./components/Header"
import Grainient from "./components/Grainient"

function App() {
  return (
    <>
      {/* Floating Pill Navigation Header */}
      <Header />

      {/* Fullscreen Moving Gradient Background */}
      <main className="canvas-wrapper">
        <Grainient />
      </main>
    </>
  )
}

export default App
