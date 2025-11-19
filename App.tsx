
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, AppState, Asset, ProjectVersion } from './types';
import { STAGES } from './constants';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { TemplatesModal } from './components/TemplatesModal';
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

const STORAGE_KEY = 'uxmate_projects_v2'; // Incremented version for structure change
const STORAGE_WARNING_THRESHOLD = 4.5 * 1024 * 1024; 
const ASSET_SIZE_WARNING_THRESHOLD = 30 * 1024 * 1024; 

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);
      
      // Migration from V1?
      const v1 = localStorage.getItem('uxmate_projects_v1');
      if (v1) {
         const parsedV1 = JSON.parse(v1);
         // Basic migration logic could go here, but for now we just start fresh or load v1 data structure 
         // which Typescript might complain about if strict, but we made types backwards compat.
         return parsedV1;
      }

    } catch (e) {
      console.error('Failed to load state', e);
    }
    return { projects: {}, activeProjectId: null };
  });

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exportProject, setExportProject] = useState<Project | null>(null);
  const [fbReady, setFbReady] = useState(false);
  
  // Mobile UI State
  const [showMobileProjects, setShowMobileProjects] = useState(false);

  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [devClickCount, setDevClickCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  useEffect(() => {
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, json);

      const totalSize = new Blob([json]).size;
      if (totalSize > STORAGE_WARNING_THRESHOLD) {
         if (!toast || toast.type !== 'error') {
           setToast({ 
             message: 'Storage Full! Export projects or delete assets immediately.', 
             type: 'error' 
           });
         }
      } else {
        const totalAssetSize = (Object.values(state.projects) as Project[]).reduce((acc, p) => {
          return acc + p.assets.reduce((sum, a) => sum + (a.size || 0), 0);
        }, 0);

        if (totalAssetSize > ASSET_SIZE_WARNING_THRESHOLD) {
          if (!toast) {
            setToast({
              message: 'Total assets exceed 30MB. App may slow down. Consider exporting old projects.',
              type: 'info'
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to save state', e);
      setToast({ message: 'Storage Quota Exceeded! Delete items now.', type: 'error' });
    }

    if (window.FB && window.FB._initialized && window.FB.auth && window.FB.auth.currentUser) {
      try {
        const uid = window.FB.auth.currentUser.uid;
        const docRef = window.FB.doc(window.FB.db, 'users', uid);
        window.FB.setDoc(docRef, { projects: state.projects }, { merge: true });
      } catch(e) {
        console.warn('Cloud save failed (silent)', e);
      }
    }
  }, [state]);

  useEffect(() => {
    const checkFB = () => {
      if (window.FB && window.FB._initialized) {
        setFbReady(true);
        return true;
      }
      return false;
    };

    if (!checkFB()) {
      const interval = setInterval(() => {
        if (checkFB()) clearInterval(interval);
      }, 500);
      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure example project exists
  useEffect(() => {
    if (Object.keys(state.projects).length === 0) {
      const id = uid();
      const example: Project = {
        id,
        title: 'Example: Food App',
        desc: 'Redesign checkout flow',
        notes: '',
        stages: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: false }), {}),
        steps: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: { notes: s.id === 'problem' ? 'Problem: High drop-off at payment.' : '', isComplete: false } }), {}),
        assets: [],
        createdAt: new Date().toISOString(),
        currentStepId: 'problem'
      };
      setState({ projects: { [id]: example }, activeProjectId: id });
    }
  }, []);

  const activeProject = state.activeProjectId ? state.projects[state.activeProjectId] : null;

  const handleCreateProject = (title: string, desc: string) => {
    const id = uid();
    const newProj: Project = {
      id,
      title,
      desc,
      notes: '', // Legacy
      stages: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: false }), {}),
      steps: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: { notes: '', isComplete: false } }), {}),
      assets: [],
      createdAt: new Date().toISOString(),
      currentStepId: 'problem'
    };
    setState(prev => ({
      projects: { ...prev.projects, [id]: newProj },
      activeProjectId: id
    }));
    setToast({ message: 'Project created', type: 'success' });
    setShowMobileProjects(false);
  };

  const deleteProject = (id: string) => {
    const projectToDelete = state.projects[id];
    if (!projectToDelete) return;

    setState(prev => {
      const nextProjects = { ...prev.projects };
      delete nextProjects[id];
      const nextId = prev.activeProjectId === id 
        ? (Object.keys(nextProjects)[0] || null) 
        : prev.activeProjectId;
        
      return { projects: nextProjects, activeProjectId: nextId };
    });

    setToast({
      message: 'Project deleted',
      type: 'info',
      onUndo: () => {
        setState(prev => ({
          projects: { ...prev.projects, [id]: projectToDelete },
          activeProjectId: id 
        }));
        setToast({ message: 'Project restored', type: 'success' });
      }
    });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: {
        ...prev.projects,
        [id]: { ...prev.projects[id], ...updates }
      }
    }));
  };

  const updateStepData = (stepId: string, data: { notes: string; isComplete: boolean }) => {
     if (!activeProject) return;
     setState(prev => {
         const p = prev.projects[activeProject.id];
         const newSteps = { ...p.steps };
         newSteps[stepId] = { ...newSteps[stepId], ...data };
         
         // Auto-update history
         const currentVersion: ProjectVersion = {
            timestamp: new Date().toISOString(),
            notes: p.notes,
            stepData: newSteps
         };
         const newHistory = [currentVersion, ...(p.history || [])].slice(0, 3);

         return {
             ...prev,
             projects: {
                 ...prev.projects,
                 [p.id]: { ...p, steps: newSteps, history: newHistory }
             }
         };
     });
  };

  const handleStepSelect = (stepId: string) => {
    if (activeProject) {
        updateProject(activeProject.id, { currentStepId: stepId });
        // Close mobile sidebar if open
        setShowMobileProjects(false);
    }
  };

  const duplicateProject = (id: string) => {
    const source = state.projects[id];
    if(!source) return;
    
    const newId = uid();
    const clone: Project = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    
    setState(prev => ({
      projects: { ...prev.projects, [newId]: clone },
      activeProjectId: newId
    }));
    setToast({ message: 'Project duplicated', type: 'success' });
  };

  const switchProject = (id: string) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
    setShowMobileProjects(false);
  };

  const restoreProjectVersion = useCallback((version: ProjectVersion) => {
    setState(prev => {
      if (!prev.activeProjectId) return prev;
      const p = prev.projects[prev.activeProjectId];
      
      const currentVersion: ProjectVersion = {
        timestamp: new Date().toISOString(),
        notes: p.notes,
        stepData: p.steps
      };
      const newHistory = [currentVersion, ...(p.history || [])].slice(0, 3);

      return {
        ...prev,
        projects: {
          ...prev.projects,
          [p.id]: { 
              ...p, 
              notes: version.notes, 
              steps: version.stepData || p.steps, // Restore steps if available
              history: newHistory 
          }
        }
      };
    });
    setToast({ message: 'Version restored', type: 'success' });
  }, []);

  const processFile = async (file: File): Promise<Partial<Asset>> => {
    const cloudAvailable = window.FB && window.FB._initialized && window.FB.auth && window.FB.auth.currentUser;

    if (cloudAvailable && window.uploadFileToFirebase) {
      try {
        const url = await window.uploadFileToFirebase(file);
        return { name: file.name, type: file.type, url, createdAt: new Date().toISOString(), size: file.size };
      } catch (err) {
        console.warn('Firebase upload failed', err);
        throw err;
      }
    }

    if (file.size > 2.5 * 1024 * 1024) {
      alert('File is too large (>2.5MB) for Local Mode.\n\nEnable Cloud Sync in index.html for unlimited uploads.');
      throw new Error('File too large');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          type: file.type,
          dataURL: e.target?.result as string,
          createdAt: new Date().toISOString(),
          size: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAssetUpload = async (file: File) => {
    if (!activeProject) return;
    try {
      const assetData = await processFile(file);
      // Tag with current step!
      const currentStep = activeProject.currentStepId || 'problem';
      const assetWithStep: Asset = { ...(assetData as Asset), stepId: currentStep };
      
      addAsset(assetWithStep);
      setToast({ message: 'Asset uploaded to ' + STAGES.find(s=>s.id===currentStep)?.label, type: 'success' });
    } catch (e) { }
  };

  const handleReplaceAsset = async (index: number, file: File) => {
     if (!state.activeProjectId) return;
     try {
       const assetData = await processFile(file);
       setState(prev => {
         if (!prev.activeProjectId) return prev;
         const p = prev.projects[prev.activeProjectId];
         const newAssets = [...p.assets];
         // Keep original stepId when replacing
         const originalStepId = newAssets[index].stepId;
         newAssets[index] = { ...(assetData as Asset), stepId: originalStepId };
         
         return {
           ...prev,
           projects: {
             ...prev.projects,
             [p.id]: { ...p, assets: newAssets }
           }
         };
       });
       setToast({ message: 'Asset replaced', type: 'success' });
     } catch (e) { }
  };

  const addAsset = (asset: Asset) => {
    setState(prev => {
      if (!prev.activeProjectId) return prev;
      const p = prev.projects[prev.activeProjectId];
      return {
        ...prev,
        projects: {
          ...prev.projects,
          [p.id]: { ...p, assets: [...p.assets, asset] }
        }
      };
    });
  };

  const deleteAsset = (index: number) => {
    setConfirmConfig({
        isOpen: true,
        title: 'Remove Asset?',
        message: 'Are you sure you want to delete this asset?',
        onConfirm: () => {
            setState(prev => {
                if (!prev.activeProjectId) return prev;
                const p = prev.projects[prev.activeProjectId];
                const newAssets = [...p.assets];
                newAssets.splice(index, 1);
                return {
                    ...prev,
                    projects: { ...prev.projects, [p.id]: { ...p, assets: newAssets } }
                };
            });
            setToast({ message: 'Asset removed', type: 'info' });
        }
    });
  };

  const handleTemplateInsert = (content: string) => {
    if (!activeProject) return;
    const currentStep = activeProject.currentStepId || 'problem';
    const currentNotes = activeProject.steps?.[currentStep]?.notes || '';
    
    updateStepData(currentStep, {
        notes: currentNotes + (currentNotes ? "\n\n" : "") + content,
        isComplete: activeProject.steps?.[currentStep]?.isComplete || false
    });
    setToast({ message: 'Template inserted', type: 'success' });
  };

  const handleOpenExport = (project: Project) => {
    setExportProject(project);
  };

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  const handleLogoClick = () => {
    if (isDevMode) return;
    const newCount = devClickCount + 1;
    setDevClickCount(newCount);
    if (newCount === 5) {
      setIsDevMode(true);
      setToast({ message: 'Developer Mode Enabled 👩‍💻', type: 'success' });
    }
  };

  const handleWipeAllData = () => {
    if (confirm('CRITICAL WARNING: This will wipe ALL local projects and data. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) setShowMobileProjects(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header - Light Theme */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-4 md:px-6 sticky top-0 z-40 shrink-0 shadow-sm">
        <div 
          className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white mr-3 shadow-sm select-none cursor-pointer active:scale-95 transition-transform"
          onClick={handleLogoClick}
        >
          UX
        </div>
        <h1 className="font-bold text-lg tracking-tight text-slate-900">UXMate</h1>
        <div className="ml-auto text-xs flex items-center gap-3">
          {isDevMode && (
            <button 
              onClick={() => setIsDebugOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
              title="Open Debug Panel"
            >
              <IconBug className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Debug</span>
            </button>
          )}
          
          <div className="hidden sm:block">
            {fbReady ? (
              <span className="text-emerald-600 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_currentColor]"></span>
                Cloud Active
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Local
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] mx-auto w-full md:p-6 md:gap-6 relative pb-24 md:pb-6">
        
        <Sidebar 
          state={state}
          activeProject={activeProject}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          switchProject={switchProject}
          deleteProject={deleteProject}
          duplicateProject={duplicateProject}
          onExport={handleOpenExport}
          className="flex p-0 h-full"
          mobileOpen={showMobileProjects}
          onCloseMobile={() => setShowMobileProjects(false)}
          
          currentStepId={activeProject?.currentStepId || 'problem'}
          onStepSelect={handleStepSelect}
        />

        <Workspace 
          project={activeProject}
          updateProject={updateProject}
          updateStepData={updateStepData}
          restoreProjectVersion={restoreProjectVersion}
          deleteAsset={deleteAsset}
          onReplaceAsset={handleReplaceAsset}
          openTemplates={() => setIsTemplatesOpen(true)}
          onExport={handleOpenExport}
          onUploadAsset={handleAssetUpload}

          currentStepId={activeProject?.currentStepId || 'problem'}
          onStepSelect={handleStepSelect}

          className="flex flex-1 p-0 h-full overflow-hidden"
        />
      </div>

      {/* Mobile Bottom Navigation (900px breakpoint) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] glass-nav border-t border-white/20 rounded-t-3xl flex items-center justify-between px-4 pb-safe z-50 shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.05)]">
         <div className="flex-1 flex justify-around items-end pb-2">
            <NavButton 
              active={showMobileProjects} 
              icon={IconMenu} 
              label="Process" 
              onClick={() => setShowMobileProjects(!showMobileProjects)} 
            />
         </div>
         
         {/* Center Space for FAB */}
         <div className="w-16 flex-shrink-0 relative flex justify-center">
           <button 
             onClick={() => setIsCreateModalOpen(true)} 
             className="absolute -top-10 w-14 h-14 bg-blue-600 rounded-full text-white shadow-fab flex items-center justify-center fab-pulse active-scale transition-transform"
             aria-label="Create New Project"
           >
             <IconPlus className="w-7 h-7" />
           </button>
         </div>
         
         <div className="flex-1 flex justify-around items-end pb-2">
            <NavButton 
              active={isTemplatesOpen} 
              icon={IconLayout} 
              label="Templates" 
              onClick={() => setIsTemplatesOpen(!isTemplatesOpen)} 
            />
         </div>
      </nav>

      <input 
        type="file" 
        ref={hiddenFileInputRef} 
        className="hidden" 
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if(e.target.files?.[0]) {
            handleAssetUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      <Tour />

      <TemplatesModal 
        isOpen={isTemplatesOpen} 
        onClose={() => setIsTemplatesOpen(false)}
        onInsert={handleTemplateInsert}
      />
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <ExportModal 
        project={exportProject}
        isOpen={!!exportProject}
        onClose={() => setExportProject(null)}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={closeConfirm}
      />
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onUndo={toast.onUndo}
          onClose={() => setToast(null)} 
        />
      )}

      {isDebugOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <IconBug className="w-5 h-5 text-blue-600" /> Developer Tools
                </h2>
                <button onClick={() => setIsDebugOpen(false)} className="text-slate-500 hover:text-slate-900">
                  <IconClose className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-[#1e1e1e] p-4 font-mono text-xs text-green-400">
                <div className="h-full overflow-auto">
                  <pre>{JSON.stringify(state, null, 2)}</pre>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <span className="text-xs text-slate-500">
                  Raw State Dump ({new Blob([JSON.stringify(state)]).size} bytes)
                </span>
                <Button variant="danger" onClick={handleWipeAllData}>
                  <IconTrash className="w-4 h-4 mr-2" /> Reset All Data
                </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, icon: Icon, label, onClick, disabled = false, className = '' }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`flex flex-col items-center gap-1 p-2 min-w-[60px] active-scale touch-target ripple-tap ${active ? 'text-blue-600' : 'text-slate-500'} ${disabled ? 'opacity-40' : ''} ${className}`}
  >
    <Icon className="w-6 h-6" />
    <span className="text-[10px] font-medium tracking-tight">{label}</span>
  </button>
);

export default App;
