import React, { useState, useEffect, useRef } from 'react';
import { TEMPLATES } from '../constants';
import { Button } from './ui/Button';
import { IconClose, IconDownload } from './ui/Icons';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedTemplate = TEMPLATES.find(t => t.key === selectedKey);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management when opening
  useEffect(() => {
    if (isOpen) {
      // Short timeout to allow render
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
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

  const handleDownload = () => {
    if (!selectedTemplate) return;
    const blob = new Blob([selectedTemplate.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.key}_template.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface border border-white/10 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 id="modal-title" className="text-lg font-bold text-white">Template Library</h2>
          <button 
            ref={closeBtnRef}
            onClick={onClose} 
            className="text-muted hover:text-white p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close modal"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-white/5 overflow-y-auto p-3 space-y-2 bg-black/20" role="list" aria-label="Templates list">
            {TEMPLATES.map(t => (
              <button 
                key={t.key}
                role="listitem"
                onClick={() => setSelectedKey(t.key)}
                className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selectedKey === t.key 
                    ? 'bg-accent text-surface font-semibold' 
                    : 'hover:bg-white/5 text-gray-300'
                }`}
                aria-selected={selectedKey === t.key}
              >
                <div className="text-sm">{t.label}</div>
                {t.desc && <div className={`text-xs mt-0.5 ${selectedKey === t.key ? 'text-surface/70' : 'text-muted'}`}>{t.desc}</div>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="w-2/3 p-5 flex flex-col bg-surface">
            {selectedTemplate ? (
              <>
                <div className="flex-1 relative">
                  <label className="absolute -top-2.5 left-2 bg-surface px-1 text-xs text-accent">Preview</label>
                  <textarea 
                    readOnly 
                    value={selectedTemplate.content}
                    className="w-full h-full bg-glass border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-300 focus:outline-none resize-none"
                    aria-label={`Preview of ${selectedTemplate.label} template`}
                  />
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <Button variant="ghost" onClick={handleDownload} aria-label="Download template as text file">
                    <IconDownload className="w-4 h-4" /> Download
                  </Button>
                  <Button onClick={() => {
                    onInsert(selectedTemplate.content);
                    onClose();
                  }}>
                    Insert into Project
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted">
                <p>Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};