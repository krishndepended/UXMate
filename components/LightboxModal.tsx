import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '../types';
import { 
  IconClose, IconArrowRight, IconDownload, IconTrash, 
  IconZoomIn, IconZoomOut, IconEye 
} from './ui/Icons';

interface LightboxModalProps {
  isOpen: boolean;
  assets: Asset[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDeleteAsset?: (index: number) => void;
  onUpdateCaption?: (index: number, caption: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  assets,
  currentIndex,
  onClose,
  onNavigate,
  onDeleteAsset,
  onUpdateCaption,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');

  const currentAsset = assets[currentIndex];

  useEffect(() => {
    if (currentAsset) {
      setCaptionDraft(currentAsset.caption || '');
      setZoomLevel(1);
      setIsEditingCaption(false);
    }
  }, [currentIndex, currentAsset]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < assets.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, assets.length, onNavigate]);

  const handleSaveCaption = () => {
    if (onUpdateCaption && currentAsset) {
      onUpdateCaption(currentIndex, captionDraft);
      setIsEditingCaption(false);
    }
  };

  const handleDownload = () => {
    if (!currentAsset) return;
    const link = document.createElement('a');
    link.href = currentAsset.url || currentAsset.dataURL || '';
    link.download = currentAsset.name || 'ux-artifact.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && !isEditingCaption) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && !isEditingCaption) {
        handleNext();
      } else if ((e.key === '+' || e.key === '=') && !isEditingCaption) {
        handleZoomIn();
      } else if (e.key === '-' && !isEditingCaption) {
        handleZoomOut();
      } else if (e.key === '0' && !isEditingCaption) {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingCaption, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentAsset) return null;

  const imgSrc = currentAsset.url || currentAsset.dataURL || '';

  return (
    <div 
      className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview Lightbox"
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 border-b border-white/10 shrink-0 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 shrink-0">
            <IconEye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate max-w-sm md:max-w-md">
              {currentAsset.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{currentIndex + 1} of {assets.length} artifacts</span>
              <span>·</span>
              <span>{new Date(currentAsset.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Toolbar Center / Right */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-1 gap-1">
            <button 
              onClick={handleZoomOut} 
              disabled={zoomLevel <= 0.5} 
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              title="Zoom Out (-)"
            >
              <IconZoomOut className="w-4 h-4 text-slate-200" />
            </button>
            <button 
              onClick={handleResetZoom} 
              className="px-2 py-1 text-xs font-mono font-medium text-slate-200 hover:bg-white/10 rounded transition-colors"
              title="Reset Zoom (0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button 
              onClick={handleZoomIn} 
              disabled={zoomLevel >= 3} 
              className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              title="Zoom In (+)"
            >
              <IconZoomIn className="w-4 h-4 text-slate-200" />
            </button>
          </div>

          <button 
            onClick={handleDownload} 
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 active:scale-95 transition-all"
            title="Download image"
          >
            <IconDownload className="w-4 h-4" />
          </button>

          {onDeleteAsset && (
            <button 
              onClick={() => {
                if (window.confirm('Delete this artifact from project?')) {
                  onDeleteAsset(currentIndex);
                  if (assets.length <= 1) {
                    onClose();
                  } else {
                    onNavigate(Math.max(0, currentIndex - 1));
                  }
                }
              }} 
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-red-300 active:scale-95 transition-all"
              title="Delete artifact"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={onClose} 
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 active:scale-95 transition-all ml-2"
            title="Close Lightbox (Esc)"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden select-none">
        {/* Previous Navigation Button */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev} 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xl active:scale-95 transition-all"
            title="Previous (Left Arrow)"
          >
            <IconArrowRight className="w-5 h-5 rotate-180" />
          </button>
        )}

        {/* Next Navigation Button */}
        {currentIndex < assets.length - 1 && (
          <button 
            onClick={handleNext} 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xl active:scale-95 transition-all"
            title="Next (Right Arrow)"
          >
            <IconArrowRight className="w-5 h-5" />
          </button>
        )}

        {/* Displayed Image */}
        <div 
          className="max-w-full max-h-full flex items-center justify-center transition-transform duration-150"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img 
            src={imgSrc} 
            alt={currentAsset.name || 'Artifact view'} 
            className="max-h-[72vh] md:max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Strategic Caption Bar */}
      <div className="px-6 py-3.5 bg-slate-900/80 border-t border-white/10 shrink-0 text-white">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditingCaption ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={captionDraft} 
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder="Explain the design rationale or test findings shown here..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCaption();
                    if (e.key === 'Escape') setIsEditingCaption(false);
                  }}
                />
                <button 
                  onClick={handleSaveCaption}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  Save
                </button>
                <button 
                  onClick={() => setIsEditingCaption(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium rounded-lg transition-colors shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div 
                onClick={() => onUpdateCaption && setIsEditingCaption(true)}
                className={`text-xs leading-relaxed cursor-pointer p-1.5 rounded hover:bg-white/5 transition-colors ${
                  currentAsset.caption ? 'text-slate-300' : 'text-slate-400 italic'
                }`}
                title="Click to edit caption"
              >
                {currentAsset.caption ? currentAsset.caption : '+ Add strategic rationale or context for this artifact...'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto text-[11px] text-slate-400 font-mono">
            <span>Use ← / → keys to browse</span>
            <span>·</span>
            <span>Esc to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
