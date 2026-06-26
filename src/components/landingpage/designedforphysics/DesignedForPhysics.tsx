import { useEffect } from "react";
import "./DesignedForPhysics.css";

const physicsSourceList = [
  {
    title: "Research Discovery",
    description: "Find relevant papers, influential publications, and emerging topics across scientific literature with greater speed and clarity.",
    id: "physics-discovery"
  },
  {
    title: "Research Understanding",
    description: "Transform complex papers into understandable insights through summaries, explanations, key findings, and equation breakdowns.",
    id: "physics-understanding"
  },
  {
    title: "Research Exploration",
    description: "Go beyond a single paper by exploring citations, related work, connected concepts, and future research directions.",
    id: "physics-exploration",
    className: "full-width-card"
  }
];

export function DesignedForPhysics() {
  useEffect(() => {
    const cards = document.querySelectorAll('#designed-for-physics .border-glow-card');
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
    <section className="physics-section" id="designed-for-physics">
      <div className="physics-container">
        {/* Section Title */}
        <h2 className="physics-section-title" id="physics-title">
          Designed For Physics Research
        </h2>
        <p className="physics-section-subtitle" id="physics-subtitle">
          Created with the needs of researchers, educators, and students in mind. Unlike general-purpose AI tools, Physica AI is designed around the workflows commonly used during scientific exploration, literature reviews, paper analysis, and research understanding.
        </p>

        {/* Content Layout Grid */}
        <div className="physics-layout-grid">
          {/* Left Column: 3 capability cards */}
          <div className="physics-cards-grid">
            {physicsSourceList.map((src, index) => (
              <div
                className={`border-glow-card ${src.className || ""}`}
                key={src.id}
                id={src.id}
              >
                <div className="edge-light" />
                <div className="border-glow-inner">
                  <span className="physics-number">0{index + 1}</span>
                  <h3 className="physics-card-title">{src.title}</h3>
                  <p className="physics-card-description">{src.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Tall vertical "Our Goal" Card */}
          <div
            className="border-glow-card vertical-card"
            id="physics-our-goal"
          >
            <div className="edge-light" />
            <div className="border-glow-inner vertical-card-inner">
              <span className="physics-number">04</span>
              <h3 className="physics-card-title">Our Goal</h3>
              <p className="physics-card-description">
                Help researchers spend less time searching through information and more time understanding, learning, and discovering new knowledge.
              </p>
              <div className="vertical-pillars-container">
                <div className="pillar-tag">
                  <span className="pillar-bullet">•</span>
                  <span className="pillar-text">Built For Curiosity.</span>
                </div>
                <div className="pillar-tag">
                  <span className="pillar-bullet">•</span>
                  <span className="pillar-text">Designed For Discovery.</span>
                </div>
                <div className="pillar-tag">
                  <span className="pillar-bullet">•</span>
                  <span className="pillar-text">Focused On Physics.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
