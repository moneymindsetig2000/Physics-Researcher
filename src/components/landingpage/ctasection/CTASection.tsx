// Radha
import { useEffect } from "react"; // Radha
import "./CTASection.css";

export function CTASection() {
  useEffect(() => {
    const cards = document.querySelectorAll('#final-cta .border-glow-card');
    const rectCache = new Map();
    let resizeTimeout: number;
    let lastX = 0;
    let lastY = 0;

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

        // Skip calculations if mouse coordinates did not change
        if (clientX === lastX && clientY === lastY) return;
        lastX = clientX;
        lastY = clientY;

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

  const handleScrollToTop = () => {
    const scrollContainer = document.querySelector('.scroll-content-flow');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollToWorkspace = () => {
    document.getElementById("workspace-preview")?.scrollIntoView({ behavior: "smooth" });
  };

  const navigateToChat = () => {
    window.history.pushState({}, '', '/chat');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <section className="cta-section" id="final-cta">
      <div className="cta-container">
        <div className="border-glow-card cta-card" id="cta-card-element">
          <div className="edge-light" />
          <div className="border-glow-inner cta-card-inner">
            
            {/* Title */}
            <h2 className="cta-title">Ready To Explore Research Differently?</h2>
            
            {/* Subtitle */}
            <p className="cta-subtitle">
              Discover, understand, and explore scientific literature through an AI-powered research experience designed specifically for physics research and academic exploration.
            </p>

            {/* Description Body */}
            <p className="cta-description">
              Whether you're reviewing papers, studying new concepts, exploring citations, or searching for your next research direction, Physica AI helps transform complex scientific literature into accessible knowledge.
            </p>

            {/* Highlight Pillars */}
            <div className="cta-pillars">
              <div className="cta-pillar">
                <span className="cta-pillar-bullet">•</span>
                <span className="cta-pillar-text">Spend Less Time Searching.</span>
              </div>
              <div className="cta-pillar">
                <span className="cta-pillar-bullet">•</span>
                <span className="cta-pillar-text">More Time Discovering.</span>
              </div>
            </div>

            {/* Button Actions */}
            <div className="cta-actions">
              <button 
                className="cta-btn cta-btn-primary btn-liquid-glass-style" 
                id="cta-explore"
                onClick={navigateToChat}
              >
                Explore Research
              </button>
              <button 
                className="cta-btn cta-btn-secondary btn-liquid-glass-style" 
                id="cta-workspace"
                onClick={navigateToChat}
              >
                View Research Workspace
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
