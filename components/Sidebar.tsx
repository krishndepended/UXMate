import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, AppState } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconPlus, IconCheck, IconTrash, IconCopy, IconDownload, IconChevronDown, IconRefresh, IconCheckCircle, IconClose, IconSearch, IconFile } from './ui/Icons';

interface SidebarProps {
  state: AppState;
  onOpenCreateModal: () => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  // Stage/Upload props kept for Desktop, but mobile won't show them here
  toggleStage: (stageId: string) => void;
  toggleStageExpanded: (stageId: string) => void;
  markAllStages: () => void;
  resetStages: () => void;
  onUploadAsset: (file: File) => void;
  onExport: (project: Project) => void;
  activeProject: Project | null;
  className?: string;
  // New props for mobile drawer
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const PROJECT_ROW_HEIGHT = 88; 

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onOpenCreateModal,
  switchProject,
  deleteProject,
  duplicateProject,
  toggleStage,
  toggleStageExpanded,
  markAllStages,
  resetStages,
  onUploadAsset,
  onExport,
  activeProject,
  className = '',
  mobileOpen = false,
  onCloseMobile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setScrollTop(0); 
      if (listRef.current) listRef.current.scrollTop = 0;
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (listRef.current) {
      setViewportHeight(listRef.current.clientHeight);
      const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
          setViewportHeight(entry.contentRect.height);
        }
      });
      ro.observe(listRef.current);
      return () => ro.disconnect();
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

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

  const totalCount = filteredProjects.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / PROJECT_ROW_HEIGHT) - 2); 
  const endIndex = Math.min(totalCount, Math.ceil((scrollTop + viewportHeight) / PROJECT_ROW_HEIGHT) + 2); 
  
  const visibleProjects = filteredProjects.slice(startIndex, endIndex);
  const paddingTop = startIndex * PROJECT_ROW_HEIGHT;
  const paddingBottom = (totalCount - endIndex) * PROJECT_ROW_HEIGHT;

  const handleKeyDownList = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switchProject(projectId);
    }
  };

  // Conditional rendering classes
  // On desktop (md+): Always visible, relative, w-80/96
  // On mobile: Fixed inset-0, z-[60] (above nav), controlled by mobileOpen
  const containerClasses = `
    transition-all duration-300 ease-in-out
    md:relative md:flex md:translate-y-0 md:w-80 lg:w-96 md:flex-col md:gap-6 md:z-0
    fixed inset-0 z-[60] bg-slate-50 flex flex-col
    ${mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0 md:opacity-100'}
  `;

  return (
    <aside className={`${containerClasses} ${className}`} role="complementary" aria-label="Sidebar">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center px-6 pt-6 pb-2 bg-white/80 backdrop-blur-md border-b border-slate-100">
           <div>
             <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
             <p className="text-sm text-slate-500">Select a case study</p>
           </div>
           <button onClick={onCloseMobile} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-transform">
             <IconClose className="w-6 h-6 text-slate-600" />
           </button>
        </div>

        {/* Projects Section */}
        <div className="md:bg-white md:border md:border-slate-200 md:rounded-xl p-5 md:shadow-sm flex flex-col flex-1 md:max-h-[40vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4 hidden md:flex">
            <div>
              <h2 className="font-bold text-slate-900 text-lg md:text-base" id="projects-heading">Projects</h2>
              <p className="text-xs text-slate-500">Your case studies</p>
            </div>
            <Button 
              id="tour-create"
              size="sm" 
              onClick={onOpenCreateModal}
              aria-label="Create new project"
            >
              <IconPlus className="w-4 h-4" /> <span className="hidden md:inline">New</span>
            </Button>
          </div>

          <div className="relative mb-4 shrink-0 px-1 md:px-0">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input 
              type="text"
              placeholder="Filter projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white md:bg-slate-50 border border-slate-200 rounded-xl py-3 md:py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 shadow-sm md:shadow-none"
              aria-label="Filter projects by name or description"
            />
          </div>

          <div 
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-1 min-h-[100px] scroll-smooth md:pb-0 pb-24 px-1 md:px-0" 
            role="list" 
            aria-labelledby="projects-heading"
          >
            {totalCount === 0 ? (
              <div className="text-sm text-slate-500 italic p-8 text-center bg-white md:bg-slate-50 rounded-xl border border-slate-200 border-dashed mx-4 md:mx-0">
                {searchTerm ? 'No matching projects found.' : 'No projects yet.'}
                <div className="mt-4 md:hidden">
                   <Button onClick={onOpenCreateModal} className="w-full">Create First Project</Button>
                </div>
              </div>
            ) : (
              <div style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
                {visibleProjects.map(p => {
                  const doneCount = Object.values(p.stages).filter(Boolean).length;
                  const totalStages = STAGES.length;
                  const isActive = activeProject?.id === p.id;

                  return (
                    <div 
                      key={p.id}
                      style={{ height: `${PROJECT_ROW_HEIGHT}px` }}
                      className="pb-2 box-border block"
                    >
                      <div 
                        role="listitem"
                        className={`group relative flex flex-col gap-1 p-3 h-full rounded-xl transition-all cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isActive 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 md:border-transparent md:hover:border-slate-200 shadow-sm md:shadow-none'
                        }`}
                        onClick={() => switchProject(p.id)}
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDownList(e, p.id)}
                        aria-current={isActive ? 'true' : undefined}
                        aria-label={`${p.title}, ${doneCount} of ${totalStages} stages complete`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className={`font-bold text-base md:text-sm truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                            {p.title}
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500 truncate min-h-[1.25em]">
                          {p.desc || 'No description'}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[10px] text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                          <div className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            doneCount === totalStages ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {doneCount}/{totalStages}
                          </div>
                        </div>

                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white/90 rounded p-0.5 border border-slate-200 shadow-sm backdrop-blur-sm z-10">
                          <button 
                            type="button"
                            className="text-slate-500 hover:text-slate-900 p-1.5 rounded hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                            className="text-slate-500 hover:text-slate-900 p-1.5 rounded hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onExport(p);
                            }}
                            title="Export"
                          >
                            <IconDownload className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stages Section - Hidden on mobile, handled by Workspace tabs */}
        <div id="tour-stages" className="hidden md:flex bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 min-h-0 flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h2 className="font-bold text-slate-900 text-base" id="stages-heading">Process Checklist</h2>
              <p className="text-xs text-slate-500">Track your progress</p>
            </div>
            {activeProject && (
              <div className="flex gap-1">
                <button 
                  onClick={markAllStages} 
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  title="Mark all complete"
                  aria-label="Mark all stages as complete"
                >
                  <IconCheckCircle className="w-4 h-4" />
                </button>
                <button 
                  onClick={resetStages} 
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  title="Reset stages"
                  aria-label="Reset all stages"
                >
                  <IconRefresh className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 pr-1 space-y-1" role="list" aria-labelledby="stages-heading">
            {activeProject ? (
              STAGES.map((stage, idx) => {
                const isDone = activeProject.stages[stage.id];
                const isExpanded = activeProject.expandedStages?.[stage.id];
                
                return (
                  <div 
                    key={stage.id} 
                    role="listitem"
                    className={`rounded-lg transition-all duration-200 ${
                      isExpanded ? 'bg-slate-50 border border-slate-200 pb-2' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <button
                        onClick={() => toggleStageExpanded(stage.id)}
                        className={`p-1 text-slate-400 hover:text-slate-800 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        aria-label={isExpanded ? `Collapse help for ${stage.label}` : `Expand help for ${stage.label}`}
                        aria-expanded={isExpanded}
                      >
                         <IconChevronDown className="w-4 h-4" />
                      </button>

                      <label 
                        className="flex-1 flex items-center gap-3 cursor-pointer select-none h-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="pt-0.5">
                          <input 
                            type="checkbox" 
                            checked={!!isDone}
                            onChange={() => toggleStage(stage.id)}
                            className="sr-only focus:not-sr-only opacity-0 focus:opacity-100 absolute w-4 h-4"
                            aria-label={`Mark ${stage.label} as complete`}
                          />
                          <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-200 ${
                            isDone 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105' 
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}>
                            {isDone && <IconCheck className="w-4 h-4 stroke-[3]" aria-hidden="true" />}
                          </div>
                        </div>
                        
                        <div className="flex-1 py-1">
                           <div className={`text-sm font-medium transition-colors ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>
                             {stage.label}
                           </div>
                           <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Step {idx + 1}</div>
                        </div>
                      </label>
                    </div>

                    {isExpanded && (
                      <div className="px-9 pb-1 text-xs text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                        {stage.help}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-500 text-center py-8">
                Select a project to view stages.
              </div>
            )}
          </div>
        </div>

        {/* Upload Section - Hidden on mobile */}
        <div id="tour-upload" className="hidden md:block bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="font-bold text-slate-900 text-base" id="upload-heading">Upload Assets</h2>
            <p className="text-xs text-slate-500">Images for your case study</p>
          </div>
          
          <div 
            className={`relative group border-2 border-dashed border-slate-300 rounded-lg p-4 text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${activeProject ? 'hover:border-blue-400 hover:bg-blue-50' : 'opacity-50 bg-slate-50'}`}
          >
            <input 
              id="fileInput"
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              disabled={!activeProject}
              aria-labelledby="upload-heading file-help-text"
              onChange={(e) => {
                if(e.target.files?.[0]) {
                  onUploadAsset(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            <div className="text-sm text-slate-600 font-medium">
              {activeProject ? 'Tap to upload' : 'Select a project first'}
            </div>
            <div id="file-help-text" className="text-xs text-slate-400 mt-2">Max 2.5MB (Local) / Unlimited (Firebase)</div>
          </div>

          {activeProject && activeProject.assets.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4" role="list" aria-label="Asset thumbnails">
              {activeProject.assets.slice(-4).reverse().map((asset, i) => (
                <div key={i} role="listitem" className="aspect-square bg-slate-100 rounded overflow-hidden relative border border-slate-200" title={asset.name}>
                  {asset.type.startsWith('image') ? (
                    <img src={asset.url || asset.dataURL} className="w-full h-full object-cover" loading="lazy" alt={`Thumbnail of ${asset.name}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><IconFile className="w-5 h-5" aria-hidden="true" /></div>
                  )}
                </div>
              ))}
               {activeProject.assets.length > 4 && (
                 <div className="flex items-center justify-center text-xs text-slate-500" aria-label={`${activeProject.assets.length - 4} more assets`}>+{activeProject.assets.length - 4}</div>
               )}
            </div>
          )}
        </div>
    </aside>
  );
};