import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, AppState } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconPlus, IconCheck, IconTrash, IconCopy, IconChevronDown, IconSearch, IconArrowRight, IconClose, IconFile, IconLayout } from './ui/Icons';

interface SidebarProps {
  state: AppState;
  onOpenCreateModal: () => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  onExport: (project: Project) => void;
  activeProject: Project | null;
  onStepSelect: (stepId: string) => void;
  currentStepId: string;
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const PROJECT_ROW_HEIGHT = 80;

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onOpenCreateModal,
  switchProject,
  deleteProject,
  duplicateProject,
  activeProject,
  onStepSelect,
  currentStepId,
  className = '',
  mobileOpen = false,
  onCloseMobile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setScrollTop(0);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (listRef.current) {
      setViewportHeight(listRef.current.clientHeight);
      const ro = new ResizeObserver(() => setViewportHeight(listRef.current?.clientHeight || 400));
      ro.observe(listRef.current);
      return () => ro.disconnect();
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);

  const filteredProjects = useMemo(() => {
    const all = Object.values(state.projects) as Project[];
    const sorted = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!debouncedSearch.trim()) return sorted;
    const lower = debouncedSearch.toLowerCase();
    return sorted.filter(p => p.title.toLowerCase().includes(lower));
  }, [state.projects, debouncedSearch]);

  const totalCount = filteredProjects.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / PROJECT_ROW_HEIGHT) - 1);
  const endIndex = Math.min(totalCount, Math.ceil((scrollTop + viewportHeight) / PROJECT_ROW_HEIGHT) + 1);
  const visibleProjects = filteredProjects.slice(startIndex, endIndex);

  return (
    <aside 
      className={`
        fixed inset-0 z-[100] bg-white flex flex-col transition-transform duration-500 ease-in-out md:relative md:translate-y-0 md:inset-auto md:z-0 md:bg-transparent md:w-80 lg:w-96 md:gap-8
        ${mobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        ${className}
      `}
      role="complementary"
    >
        {/* Mobile Sidebar Header */}
        <div className="md:hidden pt-safe shrink-0 bg-slate-900 text-white p-8 rounded-b-[3rem] shadow-fab">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tightest">Design Flow</h2>
              <p className="label-caps text-slate-400 mt-1">Milestones & Mapping</p>
            </div>
            <button onClick={onCloseMobile} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center active-scale transition-premium">
              <IconClose className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[140px]">
                <div className="label-caps text-slate-500 text-[8px]">Success Rate</div>
                <div className="text-xl font-black mt-1 text-emerald-400 tracking-tightest">
                  {activeProject ? STAGES.filter(s => activeProject.steps?.[s.id]?.isComplete).length : 0} <span className="text-xs opacity-50 font-medium">/ 12</span>
                </div>
             </div>
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[140px]">
                <div className="label-caps text-slate-500 text-[8px]">Current Phase</div>
                <div className="text-xl font-black mt-1 text-blue-400 tracking-tightest">
                  {STAGES.findIndex(s => s.id === currentStepId) + 1} / 12
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 md:gap-8 overflow-hidden p-6 md:p-0">
          {/* Project Selector - Scalable Height */}
          <div className="flex-[0.4] min-h-[180px] bg-white border border-slate-200 card-radius md:shadow-soft flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-50">
              <h3 className="label-caps tracking-widest text-[9px]">My Projects</h3>
              <Button size="sm" variant="ghost" onClick={onOpenCreateModal} className="h-8 px-4 text-blue-600 font-black hover:bg-blue-50">
                <IconPlus className="w-3.5 h-3.5 mr-2" /> New
              </Button>
            </div>

            <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
              {totalCount === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-black uppercase opacity-40">No projects found</div>
              ) : (
                <div style={{ paddingTop: `${startIndex * PROJECT_ROW_HEIGHT}px`, paddingBottom: `${(totalCount - endIndex) * PROJECT_ROW_HEIGHT}px` }}>
                  {visibleProjects.map(p => {
                    const isActive = activeProject?.id === p.id;
                    const completedCount = STAGES.filter(s => p.steps?.[s.id]?.isComplete).length;
                    return (
                      <div key={p.id} style={{ height: `${PROJECT_ROW_HEIGHT}px` }} className="pb-3">
                        <div 
                          className={`p-4 h-full rounded-2xl transition-premium cursor-pointer border flex justify-between items-center active-scale ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`} 
                          onClick={() => { switchProject(p.id); }}
                        >
                          <div className="min-w-0 pr-4">
                            <div className={`text-xs font-black truncate uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{p.title}</div>
                            <div className={`text-[9px] font-black mt-0.5 uppercase tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>{completedCount}/{STAGES.length} Done</div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button className={`p-2 rounded-xl transition-premium ${isActive ? 'bg-white/10 hover:bg-white/20' : 'text-slate-400 hover:bg-slate-200'}`} onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }}><IconCopy className="w-3.5 h-3.5" /></button>
                            <button className={`p-2 rounded-xl transition-premium ${isActive ? 'bg-white/10 hover:bg-red-400/30' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}><IconTrash className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Process Roadmap - Remaining Height */}
          <div className="flex-1 bg-white border border-slate-200 card-radius p-6 md:p-8 md:shadow-soft flex flex-col overflow-hidden mb-24 md:mb-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="label-caps tracking-widest text-[9px]">Project Roadmap</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-premium ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><IconFile className="w-4 h-4" /></button>
                 <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-premium ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><IconLayout className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
              {activeProject ? (
                viewMode === 'list' ? (
                  <div className="space-y-3">
                    {STAGES.map((stage, idx) => {
                      const isDone = activeProject.steps?.[stage.id]?.isComplete;
                      const isActive = currentStepId === stage.id;
                      return (
                        <button 
                          key={stage.id} 
                          onClick={() => { onStepSelect(stage.id); }} 
                          className={`w-full text-left rounded-2xl transition-premium border flex items-center gap-4 p-4 active-scale group ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm ring-4 ring-blue-50/50' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border-2 shrink-0 transition-premium ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md' : isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                              {isDone && !isActive ? <IconCheck className="w-5 h-5" /> : (idx + 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-900' : isDone ? 'text-emerald-900' : 'text-slate-600'}`}>{stage.label.split('. ')[1]}</div>
                            </div>
                            {isActive && <IconArrowRight className="w-4 h-4 text-blue-300 transition-premium group-hover:translate-x-1" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {STAGES.map((stage, idx) => {
                      const isDone = activeProject.steps?.[stage.id]?.isComplete;
                      const isActive = currentStepId === stage.id;
                      return (
                        <button 
                          key={stage.id} 
                          onClick={() => { onStepSelect(stage.id); }} 
                          className={`aspect-square flex flex-col items-center justify-center rounded-2xl border transition-premium active-scale relative ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-110 z-10' : isDone ? 'bg-emerald-50 text-emerald-100 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-300'}`}
                        >
                          <span className="text-xl mb-1.5">{stage.icon || '📦'}</span>
                          <span className={`text-[8px] font-black ${isActive ? 'text-white' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>{idx + 1}</span>
                          {isDone && !isActive && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />}
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-20 opacity-40 flex flex-col items-center">
                   <IconFile className="w-12 h-12 mb-4 text-slate-200" />
                   <span className="label-caps">Select a project</span>
                </div>
              )}
            </div>
          </div>
        </div>
    </aside>
  );
};