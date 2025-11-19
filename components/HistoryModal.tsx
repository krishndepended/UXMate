
import React, { useRef, useEffect } from 'react';
import { ProjectVersion } from '../types';
import { Button } from './ui/Button';
import { IconClose, IconClock, IconRefresh } from './ui/Icons';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ProjectVersion[];
  onRestore: (version: ProjectVersion) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, versions, onRestore }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => modalRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div 
        className="bg-surface border border-white/10 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
             <h2 id="history-title" className="text-xl font-bold text-white flex items-center gap-2">
               <IconClock className="w-5 h-5 text-accent" /> Project History
             </h2>
             <p className="text-xs text-muted">View and restore the last 3 autosaved versions.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close history"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {versions && versions.length > 0 ? (
            versions.map((v, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-accent">
                    {new Date(v.timestamp).toLocaleString()}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      onRestore(v);
                      onClose();
                    }}
                    className="gap-1"
                  >
                    <IconRefresh className="w-3 h-3" /> Restore
                  </Button>
                </div>
                <div className="text-xs text-muted line-clamp-3 bg-black/20 p-2 rounded border border-white/5 font-mono">
                  {v.notes || <span className="italic opacity-50">No content</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-8 italic">
              No history available yet. Versions are created automatically when you make changes.
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5 bg-black/20 text-center">
          <p className="text-xs text-muted">Note: Restoring a version overwrites current notes but saves the previous state to history.</p>
        </div>
      </div>
    </div>
  );
};
