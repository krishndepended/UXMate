import React, { useState, useEffect } from 'react';
import { STAGES } from '../constants';
import { Project } from '../types';
import { IconSearch, IconArrowRight } from './ui/Icons';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStage: (stageId: string) => void;
  onOpenCreateProject: () => void;
  onOpenExport: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStage,
  onOpenCreateProject,
  onOpenExport,
  projects,
  activeProjectId,
  onSelectProject,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allItems = [
    // Fast actions
    { id: 'act_new_project', title: 'Create New Project', category: 'Action', icon: '✨', action: onOpenCreateProject },
    { id: 'act_export', title: 'Export Case Study (PDF / Web)', category: 'Action', icon: '📄', action: onOpenExport },
    // 12 stages
    ...STAGES.map((s) => ({
      id: `stage_${s.id}`,
      title: `${s.label}`,
      subtitle: s.description,
      category: 'Stage',
      icon: s.icon || '🎯',
      action: () => onSelectStage(s.id)
    })),
    // Projects
    ...projects.map(p => ({
      id: `proj_${p.id}`,
      title: `Switch to: ${p.title}`,
      subtitle: p.desc || 'UX Project',
      category: 'Projects',
      icon: '📁',
      action: () => onSelectProject(p.id)
    }))
  ];

  const filteredItems = allItems.filter(item => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    return item.title.toLowerCase().includes(lower) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
      item.category.toLowerCase().includes(lower);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-slate-950/60 backdrop-blur-xs p-4 pt-16 md:pt-24 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <IconSearch className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Jump to stage, switch project, or export... (e.g. 'Research', 'Export')"
            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
          />
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">ESC</span>
        </div>

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium uppercase tracking-wider">
              No matching stages or projects found
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => { item.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.category}
                    </span>
                    {isSelected && <IconArrowRight className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Quick Command Palette</span>
        </div>

      </div>
    </div>
  );
};
