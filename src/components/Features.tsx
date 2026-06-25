import { useEffect } from 'react'
import './Features.css'

export function Features() {
  const featureList = [
    {
      title: "Research Paper Discovery",
      description: "Locate relevant physics research papers by topics, concepts, keywords, authors, and research domains.",
      id: "feat-discovery"
    },
    {
      title: "Guided Paper Understanding",
      description: "Deconstruct complex physics literature with instant summaries, concept breakdowns, and explanations.",
      id: "feat-understanding"
    },
    {
      title: "Research Question Answering",
      description: "Ask technical questions about active research papers and receive grounded, contextual answers.",
      id: "feat-qa"
    },
    {
      title: "Literature Review Assistance",
      description: "Explore literature trends, trace similar work, and navigate citation networks automatically.",
      id: "feat-lit-review"
    },
    {
      title: "Equation Understanding",
      description: "Break down and understand advanced mathematical equations and physical representations.",
      id: "feat-equations"
    },
    {
      title: "Insight Extraction",
      description: "Extract novel scientific contributions, key findings, and identify active research gaps.",
      id: "feat-insights"
    }
  ]

  useEffect(() => {
    const cards = document.querySelectorAll('#features .border-glow-card')
    const rectCache = new Map()
    let resizeTimeout: number

    // Cache all card rects on mount and resize
    const updateRectCache = () => {
      cards.forEach(card => {
        rectCache.set(card, card.getBoundingClientRect())
      })
    }

    // Initial cache
    updateRectCache()

    // Optimized resize handler with debouncing
    const handleResize = () => {
      if (resizeTimeout) cancelAnimationFrame(resizeTimeout)
      resizeTimeout = requestAnimationFrame(() => {
        updateRectCache()
      })
    }

    window.addEventListener('resize', handleResize, { passive: true })

    // Store references for cleanup
    const cardCleanups: (() => void)[] = []

    cards.forEach(card => {
      let frameId: number | null = null
      let isHovering = false

      const handleMouseEnter = () => {
        isHovering = true
        // Force rect update on hover in case of any layout shift
        rectCache.set(card, card.getBoundingClientRect())
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isHovering) return

        const clientX = e.clientX
        const clientY = e.clientY

        // Only schedule RAF if one isn't already pending
        if (frameId !== null) return

        frameId = requestAnimationFrame(() => {
          const rect = rectCache.get(card)
          if (!rect) {
            frameId = null
            return
          }

          const x = clientX - rect.left
          const y = clientY - rect.top

          // Center coordinates
          const centerX = rect.width / 2
          const centerY = rect.height / 2

          // Angle calculation from center of the card
          const angleRad = Math.atan2(y - centerY, x - centerX)
          let angleDeg = (angleRad * 180) / Math.PI + 90
          if (angleDeg < 0) angleDeg += 360

          // Batch style updates
          const element = card as HTMLElement
          element.style.setProperty('--cursor-angle', `${angleDeg}deg`)
          element.style.setProperty('--edge-proximity', '100')

          frameId = null
        })
      }

      const handleMouseLeave = () => {
        isHovering = false
        if (frameId !== null) {
          cancelAnimationFrame(frameId)
          frameId = null
        }
        const element = card as HTMLElement
        element.style.setProperty('--edge-proximity', '0')
      }

      card.addEventListener('mouseenter', handleMouseEnter, { passive: true })
      card.addEventListener('mousemove', handleMouseMove, { passive: true })
      card.addEventListener('mouseleave', handleMouseLeave, { passive: true })

      cardCleanups.push(() => {
        if (frameId !== null) cancelAnimationFrame(frameId)
        card.removeEventListener('mouseenter', handleMouseEnter)
        card.removeEventListener('mousemove', handleMouseMove)
        card.removeEventListener('mouseleave', handleMouseLeave)
      })
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) cancelAnimationFrame(resizeTimeout)
      cardCleanups.forEach(cleanup => cleanup())
      rectCache.clear()
    }
  }, [])

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        {/* Section Title */}
        <h2 className="features-section-title" id="features-title">
          Platform Capabilities
        </h2>
        <p className="features-section-subtitle" id="features-subtitle">
          Designed specifically to amplify physics workflows and accelerate scientific discovery.
        </p>

        {/* 3x2 Grid of Cards */}
        <div className="features-grid">
          {featureList.map((feat, index) => (
            <div
              className="border-glow-card"
              key={feat.id}
              id={feat.id}
            >
              <div className="edge-light" />
              <div className="border-glow-inner">
                <span className="feature-number">0{index + 1}</span>
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-description">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}