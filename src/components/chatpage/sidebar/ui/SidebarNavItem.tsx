import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatOptionsDropdown } from '../options/ChatOptionsDropdown';

interface SidebarNavItemProps {
  id: string;
  href: string;
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  icon: React.ReactNode;
  badge?: string;
  onDeleteClick?: () => void;
  onPinClick?: () => void;
  isPinned?: boolean;
}

export function SidebarNavItem({
  id,
  href,
  label,
  isActive,
  onClick,
  icon,
  badge,
  onDeleteClick,
  onPinClick,
  isPinned
}: SidebarNavItemProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = () => setIsDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isDropdownOpen]);

  return (
    <motion.li 
      layout
      transition={{ 
        type: 'tween', 
        ease: [0.65, 0, 0.35, 1], // Apple-level custom ease-in-out (starts slow, accelerates, settles very slowly)
        duration: 0.5 
      }}
      className={`nav-item ${isActive ? 'active' : ''}`} 
      style={{ position: 'relative' }}
    >
      <a href={href} className="nav-link" id={`link-${id}`} onClick={onClick}>
        {icon}
        <span className="nav-text">{label}</span>
        {badge && <kbd className="nav-badge">{badge}</kbd>}
      </a>

      {/* Three vertical dots option button */}
      <button 
        type="button" 
        className="chat-item-options-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        aria-label="Chat options"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      <ChatOptionsDropdown 
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        isPinned={isPinned}
        onPinClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPinClick?.();
        }}
        onDeleteClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDeleteClick?.();
        }}
      />
    </motion.li>
  );
}
