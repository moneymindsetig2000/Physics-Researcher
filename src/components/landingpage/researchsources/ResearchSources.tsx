import { useEffect } from "react";
import "./ResearchSources.css";

const sourceList = [
  {
    title: "arXiv",
    description: "Open-access repository containing research papers across physics, mathematics, computer science, and related disciplines.",
    id: "source-arxiv"
  },
  {
    title: "INSPIRE",
    description: "Specialized scientific database widely used by the high-energy physics and research community.",
    id: "source-inspire"
  },
  {
    title: "NASA ADS",
    description: "Comprehensive scientific literature database covering astrophysics, astronomy, cosmology, and related fields.",
    id: "source-nasa"
  },
  {
    title: "Open Access Research Sources",
    description: "Additional publicly available academic resources supporting broader scientific exploration.",
    id: "source-open-access"
  }
];

export function ResearchSources() {
  useEffect(() => {
    const cards = document.querySelectorAll('#research-sources .border-glow-card');
    const rectCache = new Map();
    let resizeTimeout: number;

    // Cache all card rects on mount and resize
    const updateRectCache = () => {
      cards.forEach(card => {
        rectCache.set(card, card.getBoundingClientRect());
      });
    };

    // Initial cache
    updateRectCache();

    // Optimized resize handler with debouncing
    const handleResize = () => {
      if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
      resizeTimeout = requestAnimationFrame(() => {
        updateRectCache();
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Store references for cleanup
    const cardCleanups: (() => void)[] = [];

    cards.forEach(card => {
      let frameId: number | null = null;
      let isHovering = false;

      const handleMouseEnter = () => {
        isHovering = true;
        rectCache.set(card, card.getBoundingClientRect());
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isHovering) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        // Only schedule RAF if one isn't already pending
        if (frameId !== null) return;

        frameId = requestAnimationFrame(() => {
          const rect = rectCache.get(card);
          if (!rect) {
            frameId = null;
            return;
          }

          const x = clientX - rect.left;
          const y = clientY - rect.top;

          // Center coordinates
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          // Angle calculation from center of the card
          const angleRad = Math.atan2(y - centerY, x - centerX);
          let angleDeg = (angleRad * 180) / Math.PI + 90;
          if (angleDeg < 0) angleDeg += 360;

          // Batch style updates
          const element = card as HTMLElement;
          element.style.setProperty('--cursor-angle', `${angleDeg}deg`);
          element.style.setProperty('--edge-proximity', '100');

          frameId = null;
        });
      };

      const handleMouseLeave = () => {
        isHovering = false;
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        const element = card as HTMLElement;
        element.style.setProperty('--edge-proximity', '0');
      };

      card.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      card.addEventListener('mousemove', handleMouseMove, { passive: true });
      card.addEventListener('mouseleave', handleMouseLeave, { passive: true });

      cardCleanups.push(() => {
        if (frameId !== null) cancelAnimationFrame(frameId);
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      });
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
      cardCleanups.forEach(cleanup => cleanup());
      rectCache.clear();
    };
  }, []);

  return (
    <section className="sources-section" id="research-sources">
      <div className="sources-container">
        {/* Section Title */}
        <h2 className="sources-section-title" id="sources-title">
          Research Sources
        </h2>
        <p className="sources-section-subtitle" id="sources-subtitle">
          Built on trusted scientific knowledge. Physica AI connects with leading research repositories and academic sources to help researchers discover, analyze, and understand scientific literature from reliable and widely recognized platforms.
        </p>

        {/* Content Layout Grid */}
        <div className="sources-layout-grid">
          {/* Left Column: 2x2 Grid of 4 Source Cards */}
          <div className="sources-cards-grid">
            {sourceList.map((src, index) => (
              <div
                className="border-glow-card"
                key={src.id}
                id={src.id}
              >
                <div className="edge-light" />
                <div className="border-glow-inner">
                  <span className="source-number">0{index + 1}</span>
                  <h3 className="source-card-title">{src.title}</h3>
                  <p className="source-card-description">{src.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Tall vertical "Why It Matters" Card */}
          <div
            className="border-glow-card vertical-card"
            id="source-why-it-matters"
          >
            <div className="edge-light" />
            <div className="border-glow-inner vertical-card-inner">
              <span className="source-number">05</span>
              <h3 className="source-card-title">Why It Matters</h3>
              <p className="source-card-description">
                Researchers rely on trustworthy sources. By utilizing established scientific repositories, Physica AI focuses on helping users discover and understand research while maintaining a strong connection to the original scientific literature.
              </p>
              <div className="vertical-pillars-container">
                <div className="pillar-tag">
                  <span className="pillar-bullet">•</span>
                  <span className="pillar-text">Trusted Sources.</span>
                </div>
                <div className="pillar-tag">
                  <span className="pillar-bullet">•</span>
                  <span className="pillar-text">Reliable Knowledge.</span>
                </div>
                <div className="pillar-tag">
                  <span className="pillar-bullet">•</span>
                  <span className="pillar-text">Better Research Discovery.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
