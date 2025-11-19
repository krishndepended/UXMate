
import React from 'react';
import { Asset } from '../../types';
import { IconFile, IconMoreVertical } from './Icons';

interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMoreClick: (e: React.MouseEvent) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onContextMenu, onMoreClick }) => {
  const displayUrl = asset.url || asset.dataURL;
  
  // Format size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      className="group relative bg-white/5 border border-white/5 rounded-lg overflow-hidden hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer flex-shrink-0 snap-start w-full sm:w-auto sm:min-w-[200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View asset: ${asset.name}`}
    >
      {/* Image / Icon Container */}
      <div className="aspect-video w-full bg-black/20 flex items-center justify-center overflow-hidden relative">
        {asset.type.startsWith('image') && displayUrl ? (
          <img 
            src={displayUrl} 
            alt="" // Decorative
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <IconFile className="w-12 h-12 text-muted opacity-50" />
        )}
        
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info / Meta */}
      <div className="p-3 relative">
        <div className="font-medium text-sm text-gray-200 truncate pr-6" title={asset.name}>
          {asset.name}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-muted">
            {formatSize(asset.size)}
          </div>
          <div className="text-[10px] text-muted opacity-70">
            {new Date(asset.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* More Actions Trigger (Mobile/Desktop) */}
        <button 
          className="absolute top-3 right-2 p-1 text-muted hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={(e) => {
            e.stopPropagation();
            onMoreClick(e);
          }}
          aria-label="More actions for this asset"
        >
          <IconMoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
