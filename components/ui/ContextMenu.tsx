
import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ isOpen, x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      // Focus first item could be added here for full keyboard support
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Adjust position if close to edges
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 100,
  };

  return (
    <div 
      ref={menuRef}
      style={style}
      className="min-w-[160px] bg-surface border border-white/10 rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          role="menuitem"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            item.danger 
              ? 'text-red-400 hover:bg-red-500/10' 
              : 'text-gray-200 hover:bg-white/10'
          }`}
          tabIndex={0}
        >
          {item.icon && <span className="w-4 h-4 opacity-70" aria-hidden="true">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
};