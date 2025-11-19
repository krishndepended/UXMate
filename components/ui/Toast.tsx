import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onUndo?: () => void;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onUndo, onClose }) => {
  useEffect(() => {
    // Auto-dismiss after 5s
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    info: 'bg-accent',
    error: 'bg-red-500'
  };

  // Determine ARIA role based on type
  const role = type === 'error' ? 'alert' : 'status';
  // 'assertive' for errors (interrupts), 'polite' for others (waits)
  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white ${bgColors[type]} animate-in slide-in-from-bottom-5 fade-in duration-300`}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <span className="font-medium text-sm">{message}</span>
      {onUndo && (
        <button 
          onClick={onUndo}
          className="text-xs font-bold bg-black/20 hover:bg-black/30 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Undo last action"
        >
          UNDO
        </button>
      )}
      <button 
        onClick={onClose} 
        className="opacity-70 hover:opacity-100 ml-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};