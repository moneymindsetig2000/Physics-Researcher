import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './UserPromptScrubber.css';

interface ScrubberMessage {
  id: string;
  text: string;
}

interface UserPromptScrubberProps {
  messages: ScrubberMessage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function UserPromptScrubber({ messages, containerRef }: UserPromptScrubberProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  if (messages.length === 0) return null;

  const show = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 100);
  };

  const handlePromptClick = (msgId: string) => {
    const el = containerRef.current?.querySelector(`[data-message-id="${msgId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setOpen(false);
    }
  };

  return (
    <div className="scrubber-track">
      <div className="scrubber-dots-wrap">
        <div
          className="scrubber-dots"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {messages.map((msg) => (
            <div key={msg.id} className="scrubber-dot" />
          ))}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="scrubber-popup"
            onMouseEnter={show}
            onMouseLeave={hide}
            initial={{ opacity: 0, scale: 0.95, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="scrubber-popup-inner">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="scrubber-popup-item"
                  onClick={() => handlePromptClick(msg.id)}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
