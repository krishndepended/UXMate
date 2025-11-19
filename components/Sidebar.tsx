import React, { useState, useEffect, useMemo } from 'react';
import { Project, AppState } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconPlus, IconCheck, IconTrash, IconFile, IconSearch, IconCopy, IconDownload } from './ui/Icons';
import { downloadCaseStudy } from '../utils/exporter';

interface SidebarProps {
  state: AppState;
  onOpenCreateModal: () => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  toggleStage: (stage: string) => void;
  onUploadAsset: (file: File) => void;
  activeProject: Project | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onOpenCreateModal,
  switchProject,
  deleteProject,
  duplicateProject,
  toggleStage,
  onUploadAsset,
  activeProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce Search input (200ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const all = Object.values(state.projects) as Project[];
    const sorted = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (!debouncedSearch.trim()) return sorted;

    const lower = debouncedSearch.toLowerCase();
    return sorted.filter(p => 
      p.title.toLowerCase().includes(lower) || 
      (p.desc && p.desc.toLowerCase().includes(lower))
    );
  }, [state.projects, debouncedSearch]);

  const handleKeyDownList = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switchProject(projectId);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (e.currentTarget.nextElementSibling as HTMLElement);
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (e.currentTarget.previousElementSibling as HTMLElement);
      prev?.focus();
    }
  };

  const handleStageKeyDown = (e: React.KeyboardEvent, stage: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleStage(stage);
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-6">
      {/* Projects Section */}
      <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg flex flex-col max-h-[50vh] md:max-h-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white">Projects</h2>
            <p className="text-xs text-muted">Your case studies</p>
          </div>
          <Button 
            size="sm" 
            onClick={onOpenCreateModal}
            aria-label="Create new project"
          >
            <IconPlus className="w-4 h-4" /> New
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Filter projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent placeholder-muted/50"
            aria-label="Filter projects by name or description"
          />
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[100px]" role="list">
          {filteredProjects.length === 0 ? (
            <div className="text-sm text-muted italic p-4 text-center bg-white/5 rounded-lg border border-white/5 border-dashed">
              {searchTerm ? 'No matching projects found.' : 'No projects yet.'}
            </div>
          ) : (
            filteredProjects.map(p => {
              const doneCount = Object.values(p.stages).filter(Boolean).length;
              const totalStages = STAGES.length;
              const isActive = activeProject?.id === p.id;

              return (
                <div 
                  key={p.id}
                  role="listitem"
                  className={`group relative flex flex-col gap-1 p-3 rounded-lg transition-all cursor-pointer border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive 
                      ? 'bg-accent/10 border-accent/20 shadow-sm' 
                      : 'bg-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                  onClick={() => switchProject(p.id)}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDownList(e, p.id)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className={`font-semibold text-sm truncate ${isActive ? 'text-accent' : 'text-gray-200'}`}>
                      {p.title}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted truncate min-h-[1.25em]">
                    {p.desc || 'No description'}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted opacity-70">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      doneCount === totalStages ? 'bg-success/20 text-success' : 'bg-black/30 text-muted'
                    }`}>
                      {doneCount}/{totalStages}
                    </div>
                  </div>

                  {/* Quick Actions (Visible on Group Hover) */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-surface/90 rounded p-0.5 border border-white/10 shadow-lg backdrop-blur-sm">
                     <button 
                      type="button"
                      className="text-muted hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        duplicateProject(p.id); 
                      }}
                      title="Duplicate"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                    </button>
                     <button 
                      type="button"
                      className="text-muted hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        downloadCaseStudy(p);
                      }}
                      title="Export HTML"
                    >
                      <IconDownload className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      className="text-muted hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteProject(p.id); 
                      }}
                      title="Delete"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stages Section */}
      <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg flex-1 min-h-0 flex flex-col">
        <div className="mb-4">
          <h2 className="font-bold text-white">Process Checklist</h2>
          <p className="text-xs text-muted">Track your progress</p>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 space-y-1" role="list">
          {activeProject ? (
            STAGES.map((stage, idx) => {
              const isDone = activeProject.stages[stage];
              return (
                <label 
                  key={stage} 
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => handleStageKeyDown(e, stage)}
                  className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                    isDone ? 'bg-success/10' : 'hover:bg-white/5'
                  }`}
                  aria-label={`${stage} stage, ${isDone ? 'completed' : 'not completed'}`}
                >
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" 
                      checked={!!isDone}
                      onChange={() => toggleStage(stage)}
                      className="sr-only" 
                      tabIndex={-1} 
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isDone ? 'bg-success border-success text-surface' : 'border-white/20 bg-transparent'
                    }`}>
                      {isDone && <IconCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isDone ? 'text-success' : 'text-gray-300'}`}>
                      {stage}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">Step {idx + 1}</div>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="text-sm text-muted text-center py-8">
              Select a project to view stages.
            </div>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg">
        <div className="mb-3">
          <h2 className="font-bold text-white" id="upload-heading">Upload Assets</h2>
          <p className="text-xs text-muted">Images for your case study</p>
        </div>
        
        <div 
          className={`relative group border-2 border-dashed border-white/10 rounded-lg p-4 text-center transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface ${activeProject ? 'hover:border-accent/50 hover:bg-accent/5' : 'opacity-50'}`}
        >
          <input 
            id="fileInput"
            type="file" 
            accept="image/*,.png,.jpg,.jpeg,.pdf" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            disabled={!activeProject}
            aria-labelledby="upload-heading"
            aria-describedby="file-help-text"
            onChange={(e) => {
              if(e.target.files?.[0]) {
                onUploadAsset(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <div className="text-sm text-muted font-medium">
            {activeProject ? 'Click to upload file' : 'Select a project first'}
          </div>
          <div id="file-help-text" className="text-xs text-muted mt-1">Max 2.5MB (Local) / Unlimited (Firebase)</div>
        </div>

        {/* Mini Gallery Preview */}
        {activeProject && activeProject.assets.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4" role="list" aria-label="Asset thumbnails">
            {activeProject.assets.slice(-4).reverse().map((asset, i) => (
              <div key={i} role="listitem" className="aspect-square bg-white/5 rounded overflow-hidden relative" title={asset.name}>
                {asset.type.startsWith('image') ? (
                  <img src={asset.url || asset.dataURL} className="w-full h-full object-cover" alt={`Thumbnail of ${asset.name}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted"><IconFile className="w-5 h-5" /></div>
                )}
              </div>
            ))}
             {activeProject.assets.length > 4 && (
               <div className="flex items-center justify-center text-xs text-muted" aria-label={`${activeProject.assets.length - 4} more assets`}>+{activeProject.assets.length - 4}</div>
             )}
          </div>
        )}
      </div>
    </aside>
  );
};