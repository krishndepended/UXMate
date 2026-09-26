import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, AppState } from '../types';
import { STAGES, MACRO_PHASES } from '../constants';
import { Button } from './ui/Button';
import { 
  IconPlus, IconCheck, IconTrash, IconCopy, 
  IconArrowRight, IconClose, IconFile, IconLayout 
} from './ui/Icons';

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

const PROJECT_ROW_HEIGHT = 70;

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
  const [viewMode, setViewMode] = useState<'phases' | 'list' | 'map'>('phases');
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
        fixed inset-0 z-[100] bg-white flex flex-col transition-transform duration-500 ease-in-out md:relative md:translate-y-0 md:inset-auto md:z-0 md:bg-transparent md:w-80 lg:w-88 md:gap-5
        ${mobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        ${className}
      `}
      role="complementary"
    >
      {/* Mobile Sidebar Header */}
      <div className="md:hidden pt-safe shrink-0 bg-slate-900 text-white p-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Design Roadmap</h2>
            <p className="text-xs text-slate-400 mt-0.5">12-Step Product Design Process</p>
          </div>
          <button onClick={onCloseMobile} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-all">
            <IconClose className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
           <div className="bg-white/10 border border-white/10 rounded-xl p-3 min-w-[120px]">
              <div className="text-[10px] text-slate-400 font-medium">Completed</div>
              <div className="text-base font-bold mt-0.5 text-emerald-400 font-mono">
                {activeProject ? STAGES.filter(s => activeProject.steps?.[s.id]?.isComplete).length : 0} <span className="text-xs opacity-50 font-sans">/ 12</span>
              </div>
           </div>
           <div className="bg-white/10 border border-white/10 rounded-xl p-3 min-w-[120px]">
              <div className="text-[10px] text-slate-400 font-medium">Current Step</div>
              <div className="text-base font-bold mt-0.5 text-blue-400 font-mono">
                {STAGES.findIndex(s => s.id === currentStepId) + 1} <span className="text-xs opacity-50 font-sans">of 12</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 overflow-hidden p-4 md:p-0">
        
        {/* Projects List Panel */}
        <div className="flex-[0.32] min-h-[160px] bg-white border border-slate-200 rounded-2xl md:shadow-xs flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Projects</span>
              <span className="text-[11px] text-slate-400 font-mono">({totalCount})</span>
            </div>
            <Button size="sm" variant="ghost" onClick={onOpenCreateModal} className="h-7 px-2.5 text-blue-600 font-bold hover:bg-blue-50 text-xs">
              <IconPlus className="w-3 h-3 mr-1" /> New
            </Button>
          </div>

          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {totalCount === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">No projects found</div>
            ) : (
              <div style={{ paddingTop: `${startIndex * PROJECT_ROW_HEIGHT}px`, paddingBottom: `${(totalCount - endIndex) * PROJECT_ROW_HEIGHT}px` }}>
                {visibleProjects.map(p => {
                  const isActive = activeProject?.id === p.id;
                  const completedCount = STAGES.filter(s => p.steps?.[s.id]?.isComplete).length;
                  return (
                    <div key={p.id} style={{ height: `${PROJECT_ROW_HEIGHT}px` }} className="pb-1.5">
                      <div 
                        className={`p-2.5 h-full rounded-xl transition-all cursor-pointer border flex justify-between items-center active:scale-98 ${
                          isActive 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`} 
                        onClick={() => { switchProject(p.id); }}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{p.title}</div>
                          <div className={`text-[11px] mt-0.5 truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                            <span>{completedCount} of 12 steps</span>
                            {p.desc && <span> · {p.desc}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`} 
                            onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }}
                            title="Duplicate Project"
                          >
                            <IconCopy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/10 hover:bg-red-400/30 text-white' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} 
                            onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                            title="Delete Project"
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

        {/* 12-Step Process Roadmap Panel */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 md:shadow-xs flex flex-col overflow-hidden mb-16 md:mb-0">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Design Roadmap</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Double Diamond Process</p>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
               <button 
                 onClick={() => setViewMode('phases')} 
                 className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                   viewMode === 'phases' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                 }`}
                 title="Grouped by Phases"
               >
                 Phases
               </button>
               <button 
                 onClick={() => setViewMode('list')} 
                 className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                   viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                 }`}
                 title="Flat List of All 12 Steps"
               >
                 List
               </button>
               <button 
                 onClick={() => setViewMode('map')} 
                 className={`p-1 text-[11px] font-semibold rounded-md transition-all ${
                   viewMode === 'map' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                 }`}
                 title="Grid View"
               >
                 <IconLayout className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5 hide-scrollbar">
            {activeProject ? (
              viewMode === 'phases' ? (
                <div className="space-y-3">
                  {MACRO_PHASES.map((phase) => {
                    const phaseStages = STAGES.filter(s => phase.stageIds.includes(s.id));
                    const completedCount = phaseStages.filter(s => activeProject.steps?.[s.id]?.isComplete).length;
                    const isPhaseActive = phase.stageIds.includes(currentStepId);

                    return (
                      <div key={phase.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                        {/* Phase Header */}
                        <div className={`px-3.5 py-2 flex items-center justify-between border-b ${
                          isPhaseActive ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-100'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{phase.icon}</span>
                            <span className="text-xs font-bold tracking-tight">{phase.name}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isPhaseActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                          }`}>
                            {completedCount}/{phaseStages.length}
                          </span>
                        </div>

                        {/* Phase Steps */}
                        <div className="p-1.5 space-y-1">
                          {phaseStages.map((stage) => {
                            const isDone = activeProject.steps?.[stage.id]?.isComplete;
                            const isActive = currentStepId === stage.id;
                            const globalIdx = STAGES.findIndex(s => s.id === stage.id);

                            return (
                              <button
                                key={stage.id}
                                onClick={() => onStepSelect(stage.id)}
                                className={`w-full text-left rounded-lg transition-all border flex items-center gap-2.5 p-2 active:scale-98 ${
                                  isActive 
                                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs ring-1 ring-blue-500/20' 
                                    : isDone 
                                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-800 hover:bg-emerald-50' 
                                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isActive 
                                    ? 'bg-blue-600 text-white shadow-xs' 
                                    : isDone 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {isDone && !isActive ? <IconCheck className="w-3 h-3 stroke-[3]" /> : (globalIdx + 1)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium truncate leading-tight">
                                    {stage.label.split('. ')[1]}
                                  </div>
                                </div>
                                {isActive && <IconArrowRight className="w-3 h-3 text-blue-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-1.5">
                  {STAGES.map((stage, idx) => {
                    const isDone = activeProject.steps?.[stage.id]?.isComplete;
                    const isActive = currentStepId === stage.id;
                    return (
                      <button 
                        key={stage.id} 
                        onClick={() => { onStepSelect(stage.id); }} 
                        className={`w-full text-left rounded-xl transition-all border flex items-center gap-2.5 p-2.5 active:scale-98 ${
                          isActive 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                            : isDone 
                            ? 'bg-emerald-50/40 border-emerald-200 text-slate-800' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isDone && !isActive ? <IconCheck className="w-3 h-3 stroke-[3]" /> : (idx + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{stage.label.split('. ')[1]}</div>
                          </div>
                          {isActive && <IconArrowRight className="w-3 h-3 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {STAGES.map((stage, idx) => {
                    const isDone = activeProject.steps?.[stage.id]?.isComplete;
                    const isActive = currentStepId === stage.id;
                    return (
                      <button 
                        key={stage.id} 
                        onClick={() => { onStepSelect(stage.id); }} 
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 relative ${
                          isActive 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                            : isDone 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <span className="text-base mb-1">{stage.icon || '📦'}</span>
                        <span className={`text-[10px] font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>{idx + 1}</span>
                        {isDone && !isActive && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-16 opacity-50 flex flex-col items-center">
                 <IconFile className="w-8 h-8 mb-2 text-slate-300" />
                 <span className="text-xs text-slate-500 font-medium">Select or create a project</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
