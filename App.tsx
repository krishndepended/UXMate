import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, AppState, Asset, ProjectVersion } from './types';
import { STAGES } from './constants';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ExportModal } from './components/ExportModal';
import { Toast, ToastProps } from './components/ui/Toast';
import { Tour } from './components/Tour';
import { Button } from './components/ui/Button';
import { IconMenu, IconLayout, IconPlus, IconBug, IconTrash, IconClose } from './components/ui/Icons';

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
      const example: Project = {
        id, title: 'Project: Grocery App', desc: 'Redesigning the cart experience', notes: '',
        stages: {}, steps: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: { notes: '', isComplete: false } }), {}),
        assets: [], createdAt: new Date().toISOString(), currentStepId: 'problem'
      };
      setState({ projects: { [id]: example }, activeProjectId: id });
    }
  }, []);

  const activeProject = state.activeProjectId ? state.projects[state.activeProjectId] : null;

  const handleCreateProject = (title: string, desc: string) => {
    const id = uid();
    const newProj: Project = { id, title, desc, notes: '', stages: {}, steps: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: { notes: '', isComplete: false } }), {}), assets: [], createdAt: new Date().toISOString(), currentStepId: 'problem' };
    setState(prev => ({ projects: { ...prev.projects, [id]: newProj }, activeProjectId: id }));
    setShowMobileProjects(false);
  };

  const deleteProject = (id: string) => {
    setState(prev => {
      const nextProjects = { ...prev.projects };
      delete nextProjects[id];
      return { projects: nextProjects, activeProjectId: prev.activeProjectId === id ? (Object.keys(nextProjects)[0] || null) : prev.activeProjectId };
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
         return { ...prev, projects: { ...prev.projects, [p.id]: { ...p, steps: newSteps, history: [{ timestamp: new Date().toISOString(), notes: p.notes, stepData: newSteps }, ...(p.history || [])].slice(0, 3) } } };
     });
  }, [state.activeProjectId]);

  const duplicateProject = (id: string) => {
    const source = state.projects[id];
    if(!source) return;
    const newId = uid();
    setState(prev => ({ projects: { ...prev.projects, [newId]: { ...source, id: newId, title: `${source.title} (Copy)`, createdAt: new Date().toISOString() } }, activeProjectId: newId }));
  };

  const handleAssetUpload = async (file: File) => {
    if (!activeProject) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const asset: Asset = { name: file.name, type: file.type, dataURL: e.target?.result as string, createdAt: new Date().toISOString(), size: file.size, stepId: activeProject.currentStepId || 'problem' };
      setState(prev => {
        const p = prev.projects[activeProject.id];
        return { ...prev, projects: { ...prev.projects, [p.id]: { ...p, assets: [...p.assets, asset] } } };
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-4 sticky top-0 z-40 shrink-0">
        <div onClick={() => { if(devClickCount + 1 === 5) setIsDevMode(true); setDevClickCount(prev => prev + 1); }} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white mr-3 shadow-md select-none cursor-pointer active:scale-95">UX</div>
        <h1 className="font-extrabold text-sm tracking-tight">UXMate</h1>
        {isDevMode && <button onClick={() => setIsDebugOpen(true)} className="ml-auto p-1.5 rounded bg-red-50 text-red-500"><IconBug className="w-4 h-4" /></button>}
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] mx-auto w-full md:p-6 md:gap-6 relative">
        <Sidebar 
          state={state} activeProject={activeProject}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          switchProject={(id) => { setState(prev => ({ ...prev, activeProjectId: id })); setShowMobileProjects(false); }}
          deleteProject={deleteProject} duplicateProject={duplicateProject}
          onExport={setExportProject}
          mobileOpen={showMobileProjects} onCloseMobile={() => setShowMobileProjects(false)}
          currentStepId={activeProject?.currentStepId || 'problem'}
          onStepSelect={(id) => { if(activeProject) updateProject(activeProject.id, { currentStepId: id }); setShowMobileProjects(false); }}
        />

        <Workspace 
          project={activeProject} 
          updateProject={updateProject} 
          updateStepData={updateStepData}
          restoreProjectVersion={(v) => { if(activeProject) updateProject(activeProject.id, { notes: v.notes, steps: v.stepData || activeProject.steps }); setToast({ message: 'Restored!', type: 'success' }); }}
          deleteAsset={(idx) => { if(activeProject) { const a = [...activeProject.assets]; a.splice(idx, 1); updateProject(activeProject.id, { assets: a }); } }}
          onReplaceAsset={() => {}} 
          isGuideOpen={isGuideOpen}
          setIsGuideOpen={setIsGuideOpen}
          onExport={setExportProject} 
          onUploadAsset={handleAssetUpload}
          currentStepId={activeProject?.currentStepId || 'problem'}
          onStepSelect={(id) => { if(activeProject) updateProject(activeProject.id, { currentStepId: id }); }}
        />
      </div>

      {/* Modern Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 glass-nav border-t border-slate-200 flex items-center justify-around px-6 pb-safe z-50">
        <NavButton active={showMobileProjects} icon={IconMenu} label="Process" onClick={() => setShowMobileProjects(!showMobileProjects)} />
        <button onClick={() => setIsCreateModalOpen(true)} className="w-14 h-14 -mt-10 bg-blue-600 rounded-full text-white shadow-fab flex items-center justify-center active:scale-90 transition-transform"><IconPlus className="w-7 h-7" /></button>
        <NavButton active={isGuideOpen} icon={IconLayout} label="Guide" onClick={() => setIsGuideOpen(true)} />
      </nav>

      <Tour />
      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateProject} />
      <ExportModal project={exportProject} isOpen={!!exportProject} onClose={() => setExportProject(null)} />
      <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
      {toast && <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onClose={() => setToast(null)} />}

      {isDebugOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg h-[60vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center"><h2 className="font-bold">Debug</h2><button onClick={() => setIsDebugOpen(false)}><IconClose className="w-5 h-5"/></button></div>
              <pre className="flex-1 overflow-auto bg-slate-900 text-green-400 p-4 text-[10px]">{JSON.stringify(state, null, 2)}</pre>
           </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-colors active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;