// REMOVED_AI: removed AI integration - local only
import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconDownload, IconTrash, IconEye, IconFile, IconEdit } from './ui/Icons';
import { downloadCaseStudy, exportCaseToPDF } from '../utils/exporter';

interface WorkspaceProps {
  project: Project | null;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProjectNotes: (notes: string) => void;
  deleteAsset: (index: number) => void;
  openTemplates: () => void;
  clearProjectData: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  updateProject,
  updateProjectNotes,
  deleteAsset,
  openTemplates,
  clearProjectData
}) => {
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Inline Editing States
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescVal, setEditDescVal] = useState('');

  useEffect(() => {
    setNotes(project?.notes || '');
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    if (notes === project.notes) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      updateProjectNotes(notes);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, project, updateProjectNotes]);

  // Handlers for Inline Edit
  const startEditTitle = () => {
    if (!project) return;
    setEditTitleVal(project.title);
    setIsEditingTitle(true);
  };
  
  const saveTitle = () => {
    if (!project) return;
    if (editTitleVal.trim() && editTitleVal !== project.title) {
      updateProject(project.id, { title: editTitleVal });
    }
    setIsEditingTitle(false);
  };

  const startEditDesc = () => {
    if (!project) return;
    setEditDescVal(project.desc);
    setIsEditingDesc(true);
  };
  
  const saveDesc = () => {
    if (!project) return;
    if (editDescVal !== project.desc) {
      updateProject(project.id, { desc: editDescVal });
    }
    setIsEditingDesc(false);
  };

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-white/5 rounded-xl p-10 text-center shadow-lg min-h-[500px]">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-muted">
          <IconFile className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Project Selected</h2>
        <p className="text-muted max-w-md">Create a new project or select one from the sidebar to start working on your case study.</p>
      </div>
    );
  }

  const completedStages = Object.values(project.stages).filter(Boolean).length;
  const progress = Math.round((completedStages / STAGES.length) * 100);

  return (
    <main className="flex-1 flex flex-col gap-6 min-w-0">
      {/* Header Card */}
      <div className="bg-surface border border-white/5 rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 group">
            {isEditingTitle ? (
              <input 
                autoFocus
                type="text"
                className="text-2xl font-bold text-white bg-black/20 border border-accent rounded px-2 py-0.5 w-full outline-none"
                value={editTitleVal}
                onChange={e => setEditTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
              />
            ) : (
              <h1 
                className="text-2xl font-bold text-white truncate cursor-pointer hover:text-accent transition-colors border border-transparent hover:border-white/5 rounded px-1 -ml-1"
                onDoubleClick={startEditTitle}
                title="Double click to edit title"
              >
                {project.title}
              </h1>
            )}
            {!isEditingTitle && (
               <button onClick={startEditTitle} className="opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-opacity">
                 <IconEdit className="w-4 h-4" />
               </button>
            )}
          </div>

          <div className="mt-1 group flex items-center gap-2">
             {isEditingDesc ? (
               <input 
                autoFocus
                type="text"
                className="text-sm text-muted bg-black/20 border border-accent rounded px-2 py-0.5 w-full max-w-md outline-none"
                value={editDescVal}
                onChange={e => setEditDescVal(e.target.value)}
                onBlur={saveDesc}
                onKeyDown={e => e.key === 'Enter' && saveDesc()}
               />
             ) : (
               <p 
                 className="text-muted text-sm cursor-pointer hover:text-white transition-colors border border-transparent hover:border-white/5 rounded px-1 -ml-1 truncate"
                 onDoubleClick={startEditDesc}
                 title="Double click to edit description"
               >
                 {project.desc || 'No description provided.'}
               </p>
             )}
             {!isEditingDesc && (
               <button onClick={startEditDesc} className="opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-opacity">
                 <IconEdit className="w-3.5 h-3.5" />
               </button>
             )}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="ghost" onClick={openTemplates} aria-label="Open templates library">Templates</Button>
          <Button 
            className="bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/10"
            onClick={() => exportCaseToPDF(project)}
            aria-label="Export project as PDF"
          >
            Export PDF
          </Button>
          <Button 
            className="bg-gradient-to-r from-success to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-surface font-bold shadow-lg shadow-emerald-900/20 border-0"
            onClick={() => downloadCaseStudy(project)}
            aria-label="Export project as HTML Case Study"
          >
            <IconDownload className="w-4 h-4" /> Export HTML
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Editor & Tools */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Notes Editor */}
          <div className="bg-surface border border-white/5 rounded-xl p-1 shadow-lg flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <label htmlFor="notes" className="text-sm font-semibold text-muted uppercase tracking-wide">Project Notes & Documentation</label>
              <div className={`text-xs transition-colors ${saveStatus === 'saved' ? 'text-success' : 'text-muted'}`}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Auto-save active'}</div>
            </div>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Start typing your problem statement, research notes, or findings here..."
              className="w-full flex-1 bg-transparent p-6 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset text-gray-300 leading-relaxed min-h-[400px]"
              aria-label="Project notes"
            />
            <div className="px-4 py-3 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
              <Button variant="danger" size="sm" onClick={clearProjectData} aria-label="Clear all project data">Clear Data</Button>
            </div>
          </div>
        </div>

        {/* Right: Progress & Assets */}
        <div className="flex flex-col gap-6">
          
          {/* Progress Card */}
          <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-white">Progress</h3>
               <span className="text-xs font-mono text-accent">{progress}%</span>
             </div>
             <div className="h-2 bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
               <div 
                 className="h-full bg-gradient-to-r from-accent to-blue-400 transition-all duration-500"
                 style={{ width: `${progress}%` }}
               />
             </div>
             <div className="mt-2 text-xs text-muted text-right">{completedStages} of {STAGES.length} stages completed</div>
          </div>

          {/* Assets List */}
          <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg flex-1">
            <h3 className="font-bold text-white mb-4">Project Assets</h3>
            {project.assets.length === 0 ? (
              <div className="text-sm text-muted text-center py-8 border border-dashed border-white/10 rounded-lg">
                No assets uploaded yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" role="list">
                {[...project.assets].reverse().map((asset, index) => {
                  const originalIndex = project.assets.length - 1 - index;
                  const displayUrl = asset.url || asset.dataURL;
                  
                  return (
                    <div key={index} role="listitem" className="group bg-white/5 rounded-lg p-3 flex gap-3 items-center hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 flex-shrink-0 bg-black/20 rounded flex items-center justify-center overflow-hidden">
                        {asset.type.startsWith('image') && displayUrl ? (
                          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <IconFile className="w-6 h-6 text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate" title={asset.name}>{asset.name}</div>
                        <div className="text-xs text-muted">{new Date(asset.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {displayUrl && (
                          <button 
                            type="button"
                            onClick={() => window.open(displayUrl, '_blank')}
                            className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            title="View"
                          >
                            <IconEye className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => deleteAsset(originalIndex)}
                          className="p-1.5 hover:bg-red-500/20 rounded text-muted hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          title="Delete"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};