import React from 'react';

interface SidebarNavItemProps {
  id: string;
  href: string;
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  icon: React.ReactNode;
  badge?: string;
}

export function SidebarNavItem({
  id,
  href,
  label,
  isActive,
  onClick,
  icon,
  badge
}: SidebarNavItemProps) {
  return (
    <li className={`nav-item ${isActive ? 'active' : ''}`}>
      <a href={href} className="nav-link" id={`link-${id}`} onClick={onClick}>
        {icon}
        <span className="nav-text">{label}</span>
        {badge && <kbd className="nav-badge">{badge}</kbd>}
      </a>
    </li>
  );
}
