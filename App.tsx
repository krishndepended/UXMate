import React, { useState, useEffect, useCallback } from 'react';
import { Project, AppState, Asset } from './types';
import { STAGES } from './constants';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ExportModal } from './components/ExportModal';
import { Toast, ToastProps } from './components/ui/Toast';
import { Tour } from './components/Tour';
import { QuickSearchModal } from './components/QuickSearchModal';
import { ProgressionBar } from './components/ProgressionBar';
import { Button } from './components/ui/Button';
import { 
  IconMenu, IconPlus, IconBug, IconClose, 
  IconArrowRight, IconSearch, IconDownload, IconCheck,
  IconSidebar
} from './components/ui/Icons';

function uid() {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = 'uxmate_projects_v2';
const STORAGE_WARNING_THRESHOLD = 4.5 * 1024 * 1024; 

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch (e) { console.error('Failed to load state', e); }
    return { projects: {}, activeProjectId: null };
  });

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exportProject, setExportProject] = useState<Project | null>(null);
  const [showMobileProjects, setShowMobileProjects] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void;}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [devClickCount, setDevClickCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('uxmate_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('uxmate_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, json);
      if (new Blob([json]).size > STORAGE_WARNING_THRESHOLD) setToast({ message: 'Storage critical!', type: 'error' });
    } catch (e) { setToast({ message: 'Storage full!', type: 'error' }); }
  }, [state]);

  useEffect(() => {
    if (Object.keys(state.projects).length === 0) {
      const id = uid();
      const starterNotes = `### Problem Framing: Mobile Checkout Friction

**Core Problem:** 
Mobile shoppers on our platform abandon their carts at a rate of 68% between the cart review and final payment step. Users express frustration over repetitive address inputs, unexpected shipping fees at the final step, and lack of biometric one-click payment options.

**Target Audience:**
- Frequent mobile shoppers aged 22–45 making repeat weekly purchases.
- First-time guests needing fast checkout without mandatory account creation.

**Business Objectives & KPIs:**
- Reduce checkout abandonment by at least 25% within 90 days of launch.
- Decrease average checkout completion time from 145 seconds to under 45 seconds.
- Increase adoption of 1-click Express Pay to 40% of transactions.`;

      const example: Project = {
        id, 
        title: 'Mobile Checkout Redesign', 
        desc: 'Streamlining cart-to-purchase flow to reduce 35% cart abandonment', 
        notes: starterNotes,
        stages: {}, 
        steps: STAGES.reduce((acc, s) => ({ 
          ...acc, 
          [s.id]: { notes: s.id === 'problem' ? starterNotes : '', isComplete: s.id === 'problem' } 
        }), {}),
        assets: [], 
        createdAt: new Date().toISOString(), 
        currentStepId: 'problem'
      };
      setState({ projects: { [id]: example }, activeProjectId: id });
    }
  }, []);

  // Global Keyboard Shortcuts (Jakob's Law)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K -> Quick Search Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      }
      // Cmd+B or Ctrl+B -> Toggle Sidebar Collapse
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const activeProject = state.activeProjectId ? state.projects[state.activeProjectId] : null;

  const handleCreateProject = (title: string, desc: string, starterNotes?: string) => {
    const id = uid();
    const newProj: Project = { 
      id, 
      title, 
      desc, 
      notes: starterNotes || '', 
      stages: {}, 
      steps: STAGES.reduce((acc, s) => ({ 
        ...acc, 
        [s.id]: { notes: s.id === 'problem' && starterNotes ? starterNotes : '', isComplete: false } 
      }), {}), 
      assets: [], 
      createdAt: new Date().toISOString(), 
      currentStepId: 'problem' 
    };
    setState(prev => ({ projects: { ...prev.projects, [id]: newProj }, activeProjectId: id }));
    setShowMobileProjects(false);
    setToast({ message: `Project "${title}" created successfully!`, type: 'success' });
  };

  const deleteProject = (id: string) => {
    const projectToDelete = state.projects[id];
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Project',
      message: `Are you sure you want to permanently delete "${projectToDelete?.title || 'this project'}"? All notes and evidence will be lost.`,
      onConfirm: () => {
        setState(prev => {
          const nextProjects = { ...prev.projects };
          delete nextProjects[id];
          return { 
            projects: nextProjects, 
            activeProjectId: prev.activeProjectId === id ? (Object.keys(nextProjects)[0] || null) : prev.activeProjectId 
          };
        });
        setToast({ message: 'Project deleted', type: 'info' });
      }
    });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({ ...prev, projects: { ...prev.projects, [id]: { ...prev.projects[id], ...updates } } }));
  };

  const updateStepData = useCallback((stepId: string, data: { notes: string; isComplete: boolean }) => {
     if (!state.activeProjectId) return;
     setState(prev => {
         const p = prev.projects[prev.activeProjectId!];
         if (!p) return prev;
         const newSteps = { ...p.steps, [stepId]: { ...p.steps[stepId], ...data } };
         return { 
           ...prev, 
           projects: { 
             ...prev.projects, 
             [p.id]: { 
               ...p, 
               steps: newSteps, 
               history: [{ timestamp: new Date().toISOString(), notes: p.notes, stepData: newSteps }, ...(p.history || [])].slice(0, 3) 
             } 
           } 
         };
     });
  }, [state.activeProjectId]);

  const duplicateProject = (id: string) => {
    const source = state.projects[id];
    if (!source) return;
    const newId = uid();
    setState(prev => ({ 
      projects: { 
        ...prev.projects, 
        [newId]: { ...source, id: newId, title: `${source.title} (Copy)`, createdAt: new Date().toISOString() } 
      }, 
      activeProjectId: newId 
    }));
    setToast({ message: `Duplicated "${source.title}"`, type: 'success' });
  };

  const handleAssetUpload = async (file: File) => {
    if (!activeProject) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const asset: Asset = { 
        name: file.name, 
        type: file.type, 
        dataURL: e.target?.result as string, 
        createdAt: new Date().toISOString(), 
        size: file.size, 
        stepId: activeProject.currentStepId || 'problem' 
      };
      setState(prev => {
        const p = prev.projects[activeProject.id];
        return { ...prev, projects: { ...prev.projects, [p.id]: { ...p, assets: [...p.assets, asset] } } };
      });
      setToast({ message: 'Evidence uploaded successfully!', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const currentStepId = activeProject?.currentStepId || 'problem';
  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const nextStep = STAGES[currentStepIndex + 1];
  const prevStep = STAGES[currentStepIndex - 1];

  const handleStepSelect = (id: string) => {
    if (activeProject) updateProject(activeProject.id, { currentStepId: id });
    setShowMobileProjects(false);
  };

  const completedStepsCount = activeProject 
    ? STAGES.filter(s => activeProject.steps?.[s.id]?.isComplete).length 
    : 0;

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Bar Contract (3-Zone: Brand — Nav / Jump — Actions) */}
      <header className="flex h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md items-center justify-between px-6 sticky top-0 z-[60] shrink-0 pt-safe">
        {/* Zone 1: Single Text Element Wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebarCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
            title="Toggle Sidebar Rail (⌘B)"
          >
            <IconSidebar className="w-4 h-4" />
          </button>
          <div 
            onClick={() => { if (devClickCount + 1 === 5) setIsDevMode(true); setDevClickCount(prev => prev + 1); }} 
            className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-xs text-white shadow-sm select-none cursor-pointer active:scale-95 transition-all"
            title="UXMate Workspace"
          >
            UX
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-slate-900">UXMate</span>
            {activeProject && (
              <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[200px]">
                · {activeProject.title}
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links & Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQuickSearchOpen(true)}
            className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all border border-slate-200"
            title="Press Cmd+K or Ctrl+K"
          >
            <IconSearch className="w-3.5 h-3.5 text-slate-400" />
            <span>Search & Jump...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-500 border border-slate-200 shadow-2xs font-semibold">⌘K</kbd>
          </button>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-all"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {activeProject && (
            <Button
              onClick={() => setExportProject(activeProject)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>Export Case Study</span>
            </Button>
          )}

          {isDevMode && (
            <button onClick={() => setIsDebugOpen(true)} className="p-1.5 rounded bg-red-50 text-red-500">
              <IconBug className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Horizontal Double Diamond Progression Bar (Macro-Phases & Wayfinding Track) */}
      <ProgressionBar 
        project={activeProject}
        currentStepId={currentStepId}
        onStepSelect={handleStepSelect}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] mx-auto w-full md:p-6 md:gap-5 relative">
        <Sidebar 
          state={state} 
          activeProject={activeProject}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          switchProject={(id) => { setState(prev => ({ ...prev, activeProjectId: id })); setShowMobileProjects(false); }}
          deleteProject={deleteProject} 
          duplicateProject={duplicateProject}
          onExport={setExportProject}
          mobileOpen={showMobileProjects} 
          onCloseMobile={() => setShowMobileProjects(false)}
          currentStepId={currentStepId}
          onStepSelect={handleStepSelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <Workspace 
          project={activeProject} 
          updateProject={updateProject} 
          updateStepData={updateStepData}
          restoreProjectVersion={(v) => { 
            if (activeProject) {
              updateProject(activeProject.id, { notes: v.notes, steps: v.stepData || activeProject.steps }); 
              setToast({ message: 'Restored history version!', type: 'success' }); 
            }
          }}
          deleteAsset={(idx) => { 
            if (activeProject) { 
              const a = [...activeProject.assets]; 
              a.splice(idx, 1); 
              updateProject(activeProject.id, { assets: a }); 
              setToast({ message: 'Evidence removed', type: 'info' }); 
            } 
          }}
          onReplaceAsset={() => {}} 
          isGuideOpen={isGuideOpen}
          setIsGuideOpen={setIsGuideOpen}
          onExport={setExportProject} 
          onUploadAsset={handleAssetUpload}
          currentStepId={currentStepId}
          onStepSelect={handleStepSelect}
          className="pb-24 md:pb-0"
        />
      </div>

      {/* Mobile Bottom Navigation (Fitts's Law thumb zone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around z-50 px-4 pt-safe">
        <button 
          onClick={() => setShowMobileProjects(prev => !prev)} 
          className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-900 active:scale-95"
        >
          <IconMenu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Roadmap</span>
        </button>

        <button 
          onClick={() => prevStep && handleStepSelect(prevStep.id)} 
          disabled={!prevStep}
          className={`flex flex-col items-center gap-1 transition-opacity ${!prevStep ? 'opacity-30' : 'text-slate-600 hover:text-slate-900 active:scale-95'}`}
        >
          <IconArrowRight className="w-5 h-5 rotate-180" />
          <span className="text-[10px] font-medium">Back</span>
        </button>

        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform"
          title="Create New Project"
        >
          <IconPlus className="w-5 h-5" />
        </button>

        <button 
          onClick={() => nextStep ? handleStepSelect(nextStep.id) : activeProject && setExportProject(activeProject)} 
          className="flex flex-col items-center gap-1 text-slate-900 font-semibold active:scale-95"
        >
          <IconArrowRight className="w-5 h-5 text-blue-600" />
          <span className="text-[10px] text-blue-600 font-bold">{nextStep ? 'Next' : 'Export'}</span>
        </button>

        <button 
          onClick={() => activeProject && setExportProject(activeProject)} 
          className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-900 active:scale-95"
        >
          <IconDownload className="w-5 h-5" />
          <span className="text-[10px] font-medium">Case Study</span>
        </button>
      </nav>

      {/* Global Modals */}
      <Tour />
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateProject} 
      />

      <ExportModal 
        project={exportProject} 
        isOpen={!!exportProject} 
        onClose={() => setExportProject(null)} 
        onUpdateProject={updateProject} 
      />

      <ConfirmModal 
        isOpen={confirmConfig.isOpen} 
        title={confirmConfig.title} 
        message={confirmConfig.message} 
        onConfirm={confirmConfig.onConfirm} 
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      <QuickSearchModal 
        isOpen={isQuickSearchOpen} 
        onClose={() => setIsQuickSearchOpen(false)} 
        onSelectStage={handleStepSelect}
        onOpenCreateProject={() => setIsCreateModalOpen(true)}
        onOpenExport={() => activeProject && setExportProject(activeProject)}
        projects={Object.values(state.projects)}
        activeProjectId={state.activeProjectId}
        onSelectProject={(id) => { setState(prev => ({ ...prev, activeProjectId: id })); }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onClose={() => setToast(null)} />}

      {isDebugOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg h-[60vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white">
                <h2 className="font-bold text-xs uppercase tracking-wider">System State</h2>
                <button onClick={() => setIsDebugOpen(false)}><IconClose className="w-5 h-5"/></button>
              </div>
              <pre className="flex-1 overflow-auto bg-slate-900 text-emerald-400 p-4 text-[10px] font-mono leading-relaxed">{JSON.stringify(state, null, 2)}</pre>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
