import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { IconClose } from './ui/Icons';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, desc: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDesc('');
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title, desc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-surface border border-white/10 w-full max-w-md rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">New Project</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><IconClose className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Project Title</label>
            <input 
              ref={titleRef}
              type="text" 
              required
              className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white focus:border-accent outline-none focus:ring-1 focus:ring-accent" 
              placeholder="e.g. Food Delivery App" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Description / Goal</label>
            <input 
              type="text" 
              className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white focus:border-accent outline-none focus:ring-1 focus:ring-accent" 
              placeholder="e.g. Redesign checkout flow" 
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </div>
    </div>
  );
};