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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><IconClose className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Title</label>
            <input 
              ref={titleRef}
              type="text" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="e.g. Food Delivery App" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description / Goal</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="e.g. Redesign checkout flow" 
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </div>
    </div>
  );
};