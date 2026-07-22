import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './UserPromptScrubber.css';

interface ScrubberMessage {
  id: string;
  text: string;
  aiId?: string;
}

interface UserPromptScrubberProps {
  messages: ScrubberMessage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function UserPromptScrubber({ messages, containerRef }: UserPromptScrubberProps) {
  const [open, setOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [popupTop, setPopupTop] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;

    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const containerRect = container.getBoundingClientRect();
        let mostVisible: string | null = null;
        let maxVisibleArea = 0;

        for (const msg of messages) {
          const userEl = container.querySelector(`[data-message-id="${msg.id}"]`);
          if (!userEl) continue;

          const userRect = userEl.getBoundingClientRect();
          const userVisibleTop = Math.max(userRect.top, containerRect.top);
          const userVisibleBottom = Math.min(userRect.bottom, containerRect.bottom);
          let visibleArea = Math.max(0, userVisibleBottom - userVisibleTop);

          if (msg.aiId) {
            const aiEl = container.querySelector(`[data-message-id="${msg.aiId}"]`);
            if (aiEl) {
              const aiRect = aiEl.getBoundingClientRect();
              const aiVisibleTop = Math.max(aiRect.top, containerRect.top);
              const aiVisibleBottom = Math.min(aiRect.bottom, containerRect.bottom);
              const aiVisibleArea = Math.max(0, aiVisibleBottom - aiVisibleTop);
              visibleArea = Math.max(visibleArea, aiVisibleArea);
            }
          }

          if (visibleArea > maxVisibleArea) {
            maxVisibleArea = visibleArea;
            mostVisible = msg.id;
          }
        }

        setActiveMessageId(prev => prev !== mostVisible ? mostVisible : prev);
      });
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [messages, containerRef]);

  const show = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 100);
  };

  const handleDotEnter = (index: number) => {
    const trackEl = trackRef.current;
    const dotsEl = trackRef.current?.querySelector('.scrubber-dots');
    const dotEl = dotsEl?.children[index] as HTMLElement | undefined;
    if (dotEl && trackEl) {
      const trackRect = trackEl.getBoundingClientRect();
      const dotRect = dotEl.getBoundingClientRect();
      const dotCenterY = dotRect.top + dotRect.height / 2;
      setPopupTop(dotCenterY - trackRect.top);
    }
    show();
  };

  if (messages.length === 0) return null;

  const handlePromptClick = (msgId: string) => {
    const el = containerRef.current?.querySelector(`[data-message-id="${msgId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setOpen(false);
    }
  };

  return (
    <div className="scrubber-track" ref={trackRef}>
      <div className="scrubber-dots-wrap">
        <div
          className="scrubber-dots"
          onMouseLeave={hide}
        >
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`scrubber-dot${activeMessageId === msg.id ? ' active' : ''}`}
              onMouseEnter={() => handleDotEnter(index)}
            />
          ))}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="scrubber-popup"
            style={{ top: popupTop }}
            onMouseEnter={show}
            onMouseLeave={hide}
            initial={{ opacity: 0, scaleX: 0.06, scaleY: 0.025 }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleX: 0.06, scaleY: 0.025 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="scrubber-popup-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, delay: 0.12 }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`scrubber-popup-item${activeMessageId === msg.id ? ' active' : ''}`}
                  onClick={() => handlePromptClick(msg.id)}
                >
                  {msg.text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
