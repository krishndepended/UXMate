
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, AppState } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconPlus, IconCheck, IconTrash, IconCopy, IconDownload, IconChevronDown, IconSearch, IconArrowRight } from './ui/Icons';

interface SidebarProps {
  state: AppState;
  onOpenCreateModal: () => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  onExport: (project: Project) => void;
  activeProject: Project | null;
  onStepSelect: (stepId: string) => void; // New
  currentStepId: string;
  className?: string;
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
  onExport,
  activeProject,
  onStepSelect,
  currentStepId,
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

  const containerClasses = `
    transition-all duration-300 ease-in-out
    md:relative md:flex md:translate-y-0 md:w-80 lg:w-96 md:flex-col md:gap-6 md:z-0
    fixed inset-0 z-[60] bg-slate-50 flex flex-col
    ${mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0 md:opacity-100'}
  `;

  return (
    <aside className={`${containerClasses} ${className}`} role="complementary" aria-label="Sidebar">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center px-6 pt-6 pb-4 bg-white/95 backdrop-blur-md border-b border-slate-100">
           <div>
             <h2 className="text-xl font-bold text-slate-900">Menu</h2>
           </div>
           <button onClick={onCloseMobile} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-transform">
             <IconChevronDown className="w-6 h-6 text-slate-600" />
           </button>
        </div>

        {/* Projects Section */}
        <div className="md:bg-white md:border md:border-slate-200 md:rounded-xl p-5 md:shadow-sm flex flex-col flex-1 md:max-h-[45vh] overflow-hidden">
          <div className="flex items-center justify-between mb-5 hidden md:flex">
            <div>
              <h2 className="font-semibold text-slate-900 text-base" id="projects-heading">Projects</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your case studies</p>
            </div>
            <Button 
              id="tour-create"
              size="sm" 
              onClick={onOpenCreateModal}
              aria-label="Create new project"
            >
              <IconPlus className="w-4 h-4 mr-1.5" /> New
            </Button>
          </div>

          <div className="relative mb-6 shrink-0 px-1 md:px-0">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white md:bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 shadow-sm md:shadow-none transition-all"
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
                  const totalSteps = STAGES.length;
                  const completedSteps = STAGES.filter(s => p.steps?.[s.id]?.isComplete).length;
                  const isActive = activeProject?.id === p.id;

                  return (
                    <div 
                      key={p.id}
                      style={{ height: `${PROJECT_ROW_HEIGHT}px` }}
                      className="pb-3 box-border block"
                    >
                      <div 
                        role="listitem"
                        className={`group relative flex justify-between items-center p-4 h-full rounded-xl transition-all cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isActive 
                            ? 'bg-blue-50/80 border-blue-200 shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-200/60 hover:border-slate-300 hover:shadow-sm'
                        }`}
                        onClick={() => switchProject(p.id)}
                        tabIndex={0}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center gap-1">
                          <div className={`font-bold text-sm truncate leading-tight ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                            {p.title}
                          </div>
                          
                          <div className="text-xs text-slate-500 truncate">
                            {p.desc || 'No description'}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {completedSteps > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                completedSteps === totalSteps ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {completedSteps}/{totalSteps}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              duplicateProject(p.id); 
                            }}
                            title="Duplicate"
                          >
                            <IconCopy className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onExport(p);
                            }}
                            title="Export"
                          >
                            <IconDownload className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              deleteProject(p.id); 
                            }}
                            title="Delete"
                          >
                            <IconTrash className="w-4 h-4" />
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

        {/* Steps Navigation Section */}
        <div id="tour-stages" className="hidden md:flex bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 min-h-0 flex-col">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h2 className="font-semibold text-slate-900 text-base" id="stages-heading">Process</h2>
              <p className="text-xs text-slate-500 mt-0.5">12-Step Design Guide</p>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 space-y-1" role="list" aria-labelledby="stages-heading">
            {activeProject ? (
              STAGES.map((stage, idx) => {
                // Use optional chaining safely
                const stepData = activeProject.steps?.[stage.id] || { isComplete: false };
                const isDone = stepData.isComplete;
                const isActive = currentStepId === stage.id;
                
                return (
                  <button
                    key={stage.id} 
                    onClick={() => onStepSelect(stage.id)}
                    className={`w-full text-left rounded-lg transition-all duration-200 border flex items-center gap-3 p-2.5 ${
                      isActive 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        {isDone && !isActive ? <IconCheck className="w-3.5 h-3.5 stroke-[3]" /> : (idx + 1)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <div className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                           {stage.label.replace(/^\d+\.\s/, '')}
                         </div>
                      </div>

                      {isActive && <IconArrowRight className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })
            ) : (
              <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Select a project first
              </div>
            )}
          </div>
        </div>
    </aside>
  );
};
