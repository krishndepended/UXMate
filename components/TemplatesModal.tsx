
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TEMPLATES } from '../constants';
import { Button } from './ui/Button';
import { IconClose, IconDownload, IconSearch, IconTag, IconPlus } from './ui/Icons';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>(['All']);
    TEMPLATES.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, []);

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch = 
        t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCat = activeCategory === 'All' || t.category === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchTerm, activeCategory]);

  // Focus management when opening
  useEffect(() => {
    if (isOpen) {
      // Short timeout to allow render
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      setSearchTerm('');
      setActiveCategory('All');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInsertAsBlock = (t: typeof TEMPLATES[0]) => {
    const timestamp = new Date().toLocaleString();
    const block = `
<details open>
<summary>Template: ${t.label} (${timestamp})</summary>

${t.content}

</details>
`;
    onInsert(block);
  };

  const handleQuickInsert = (t: typeof TEMPLATES[0]) => {
    onInsert(t.content);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface border border-white/10 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
             <h2 id="modal-title" className="text-xl font-bold text-white">Template Library</h2>
             <p className="text-xs text-muted">Insert structured guides into your project notes</p>
          </div>
          <button 
            ref={closeBtnRef}
            onClick={onClose} 
            className="text-muted hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close modal"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: Categories */}
          <div className="w-48 border-r border-white/5 bg-black/20 p-4 space-y-1 overflow-y-auto hidden md:block">
            <h3 className="text-xs font-bold text-muted uppercase mb-2 tracking-wide">Categories</h3>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-accent text-surface' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-surface">
            
            {/* Toolbar: Search */}
            <div className="p-4 border-b border-white/5 flex gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search templates, tags..." 
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              {/* Mobile Category Dropdown (visible only on small screens) */}
              <select 
                className="md:hidden bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5 bg-surface">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(t => (
                  <div 
                    key={t.key} 
                    className="group bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 hover:border-white/10 transition-all flex flex-col h-full"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{t.label}</h3>
                      {t.category && (
                         <span className="text-[10px] bg-black/40 text-muted px-2 py-0.5 rounded-full uppercase tracking-wider">{t.category}</span>
                      )}
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-muted mb-3 line-clamp-2 flex-1">{t.desc || 'No description available.'}</p>

                    {/* Tags */}
                    {t.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {t.tags.slice(0,3).map(tag => (
                          <span key={tag} className="inline-flex items-center text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                             <IconTag className="w-3 h-3 mr-1 opacity-50" /> {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-center"
                        onClick={() => handleQuickInsert(t)}
                        title="Insert plain text"
                      >
                        Insert Text
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="w-full justify-center" 
                        onClick={() => handleInsertAsBlock(t)}
                        title="Insert as collapsible block"
                      >
                        <IconPlus className="w-3 h-3" /> As Block
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
                   <p>No templates match your search.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
