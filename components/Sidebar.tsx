import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, AppState } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconPlus, IconCheck, IconTrash, IconCopy, IconDownload, IconChevronDown, IconSearch, IconArrowRight, IconClose } from './ui/Icons';

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
        fixed inset-0 z-[100] bg-white flex flex-col transition-transform duration-300 md:relative md:translate-y-0 md:inset-auto md:z-0 md:bg-transparent md:w-80 lg:w-96 md:gap-6
        ${mobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        ${className}
      `}
      role="complementary"
    >
        {/* Mobile Close Handle */}
        <div className="md:hidden pt-safe shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
            <h2 className="text-lg font-bold text-slate-900">Process & Projects</h2>
            <button onClick={onCloseMobile} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 active:scale-90 transition-transform">
              <IconClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Project Selector - Reduced vertical footprint */}
        <div className="md:bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:shadow-soft flex flex-col h-[35vh] md:h-auto md:max-h-[40vh]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Projects</h3>
            <Button size="sm" variant="ghost" onClick={onOpenCreateModal} className="h-7 px-2 text-blue-600">
              <IconPlus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>

          <div className="relative mb-3 shrink-0">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            />
          </div>

          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-1 space-y-2">
            {totalCount === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">No projects found</div>
            ) : (
              <div style={{ paddingTop: `${startIndex * PROJECT_ROW_HEIGHT}px`, paddingBottom: `${(totalCount - endIndex) * PROJECT_ROW_HEIGHT}px` }}>
                {visibleProjects.map(p => {
                  const isActive = activeProject?.id === p.id;
                  const completedCount = STAGES.filter(s => p.steps?.[s.id]?.isComplete).length;
                  return (
                    <div key={p.id} style={{ height: `${PROJECT_ROW_HEIGHT}px` }} className="pb-2">
                      <div 
                        className={`p-3 h-full rounded-xl transition-all cursor-pointer border flex justify-between items-center ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`} 
                        onClick={() => { switchProject(p.id); }}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-sm font-bold truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>{p.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{completedCount}/{STAGES.length} Done</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 active:scale-90" onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }}><IconCopy className="w-4 h-4" /></button>
                          <button className="p-1.5 text-slate-400 hover:text-red-500 active:scale-90" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}><IconTrash className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Process Steps - Optimized for Mobile Scrolling */}
        <div className="flex-1 bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:shadow-soft flex flex-col overflow-hidden mb-20 md:mb-0">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Design Process Steps</h3>
          <div className="overflow-y-auto flex-1 pr-1 space-y-2 pb-10">
            {activeProject ? (
              STAGES.map((stage, idx) => {
                const isDone = activeProject.steps?.[stage.id]?.isComplete;
                const isActive = currentStepId === stage.id;
                return (
                  <button 
                    key={stage.id} 
                    onClick={() => { onStepSelect(stage.id); }} 
                    className={`w-full text-left rounded-xl transition-all border flex items-center gap-3 p-3 active:scale-[0.98] ${isActive ? 'bg-white border-blue-300 shadow-md ring-2 ring-blue-50' : 'border-transparent hover:bg-slate-50'}`}
                  >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border shrink-0 ${isActive ? 'bg-blue-600 border-blue-600 text-white' : isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                        {isDone && !isActive ? <IconCheck className="w-4 h-4" /> : (idx + 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className={`text-sm font-bold truncate ${isActive ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-600'}`}>{stage.label.split('. ')[1]}</div>
                         {isActive && <div className="text-[10px] text-blue-500 font-medium animate-pulse">Current Phase</div>}
                      </div>
                      {isActive && <IconArrowRight className="w-4 h-4 text-blue-300" />}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">Select a project to see steps</div>
            )}
          </div>
        </div>
    </aside>
  );
};