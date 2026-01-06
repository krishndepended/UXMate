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
import { IconMenu, IconLayout, IconPlus, IconBug, IconTrash, IconClose, IconCheck, IconArrowRight } from './components/ui/Icons';

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
      setToast({ message: 'Evidence uploaded successfully!', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const currentStepId = activeProject?.currentStepId || 'problem';
  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const nextStep = STAGES[currentStepIndex + 1];
  const prevStep = STAGES[currentStepIndex - 1];
  const isStepComplete = activeProject?.steps?.[currentStepId]?.isComplete;

  const toggleStepCompletion = () => {
    if (!activeProject) return;
    const stepData = activeProject.steps[currentStepId] || { notes: '', isComplete: false };
    updateStepData(currentStepId, { notes: stepData.notes, isComplete: !stepData.isComplete });
  };

  const handleStepSelect = (id: string) => {
    if (activeProject) updateProject(activeProject.id, { currentStepId: id });
    setShowMobileProjects(false);
  };

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md items-center px-6 sticky top-0 z-[60] shrink-0 pt-safe">
        <div onClick={() => { if(devClickCount + 1 === 5) setIsDevMode(true); setDevClickCount(prev => prev + 1); }} className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white mr-3 shadow-md select-none cursor-pointer active:scale-95">UX</div>
        <h1 className="font-black text-base tracking-tightest">UXMate</h1>
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
          currentStepId={currentStepId}
          onStepSelect={handleStepSelect}
        />

        <Workspace 
          project={activeProject} 
          updateProject={updateProject} 
          updateStepData={updateStepData}
          restoreProjectVersion={(v) => { if(activeProject) updateProject(activeProject.id, { notes: v.notes, steps: v.stepData || activeProject.steps }); setToast({ message: 'Restored history version!', type: 'success' }); }}
          deleteAsset={(idx) => { if(activeProject) { const a = [...activeProject.assets]; a.splice(idx, 1); updateProject(activeProject.id, { assets: a }); setToast({ message: 'Artifact removed', type: 'info' }); } }}
          onReplaceAsset={() => {}} 
          isGuideOpen={isGuideOpen}
          setIsGuideOpen={setIsGuideOpen}
          onExport={setExportProject} 
          onUploadAsset={handleAssetUpload}
          currentStepId={currentStepId}
          onStepSelect={handleStepSelect}
          className="pb-32 md:pb-0"
        />
      </div>

      {/* Unified Master Command Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[100px] bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex flex-col items-center justify-start z-50 shadow-sheet pb-safe px-4 pt-2">
        <div className="w-full flex items-center justify-between mb-1 px-4">
           <button 
             onClick={() => prevStep && handleStepSelect(prevStep.id)} 
             disabled={!prevStep}
             className={`flex items-center gap-1 py-1 text-[9px] font-black uppercase tracking-widest transition-opacity ${!prevStep ? 'opacity-0' : 'text-slate-400 active:scale-95'}`}
           >
             <IconArrowRight className="w-3.5 h-3.5 rotate-180" /> Back
           </button>
           <button 
             onClick={() => nextStep ? handleStepSelect(nextStep.id) : setExportProject(activeProject)} 
             className="flex items-center gap-1 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600 active:scale-95"
           >
             {nextStep ? 'Next Phase' : 'Finalize'} <IconArrowRight className="w-3.5 h-3.5" />
           </button>
        </div>

        <div className="w-full grid grid-cols-5 items-center h-14">
          <NavButton active={showMobileProjects} icon={IconMenu} label="Stages" onClick={() => { setShowMobileProjects(!showMobileProjects); setIsGuideOpen(false); }} />
          
          <div className="flex justify-center">
            <button 
                onClick={toggleStepCompletion} 
                className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${isStepComplete ? 'bg-emerald-500 border-emerald-200 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-300'}`}
            >
                <IconCheck className="w-6 h-6" />
                <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">{isStepComplete ? 'Done' : 'Finish'}</span>
            </button>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="w-12 h-12 bg-slate-900 rounded-3xl text-white shadow-fab flex items-center justify-center active:scale-90 transition-transform border-4 border-white"
            >
              <IconPlus className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex justify-center">
             <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 opacity-30">
               <IconArrowRight className="w-6 h-6" />
             </div>
          </div>

          <NavButton active={isGuideOpen} icon={IconLayout} label="Toolkit" onClick={() => { setIsGuideOpen(!isGuideOpen); setShowMobileProjects(false); }} />
        </div>
      </nav>

      <Tour />
      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateProject} />
      <ExportModal 
        project={exportProject} 
        isOpen={!!exportProject} 
        onClose={() => setExportProject(null)} 
        onUpdateProject={updateProject} 
      />
      <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
      {toast && <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onClose={() => setToast(null)} />}

      {isDebugOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-lg h-[60vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-slate-950 text-white">
                <h2 className="font-black text-sm uppercase tracking-widest">System Debug</h2>
                <button onClick={() => setIsDebugOpen(false)}><IconClose className="w-6 h-6"/></button>
              </div>
              <pre className="flex-1 overflow-auto bg-slate-900 text-emerald-400 p-6 text-[10px] font-mono leading-relaxed">{JSON.stringify(state, null, 2)}</pre>
           </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <Icon className="w-5 h-5 mb-0.5" />
    <span className="text-[8px] font-black uppercase tracking-[0.05em]">{label}</span>
  </button>
);

export default App;