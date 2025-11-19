
import React, { useState, useEffect, useCallback } from 'react';
import { Project, AppState, Asset } from './types';
import { STAGES } from './constants';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { TemplatesModal } from './components/TemplatesModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast, ToastProps } from './components/ui/Toast';
import { Tour } from './components/Tour';

function uid() {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = 'uxmate_projects_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return { projects: {}, activeProjectId: null };
  });

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fbReady, setFbReady] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  
  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Persist to localStorage & Firestore (Gated)
  useEffect(() => {
    // 1. Always save to LocalStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 2. Cloud save (Only if FB is fully initialized and authenticated)
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

  // Watch for Global Firebase Init
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

  // Initial Data Setup
  useEffect(() => {
    if (Object.keys(state.projects).length === 0) {
      const id = uid();
      const example: Project = {
        id,
        title: 'Example: Food App',
        desc: 'Redesign checkout flow',
        notes: 'Problem: High drop-off at payment.\nGoal: Simplify steps.',
        stages: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: false }), {}),
        expandedStages: {},
        assets: [],
        createdAt: new Date().toISOString()
      };
      setState({ projects: { [id]: example }, activeProjectId: id });
    }
  }, []);

  const activeProject = state.activeProjectId ? state.projects[state.activeProjectId] : null;

  // --- Helper for debug ---
  const dumpLocalState = () => {
    console.group('UXMate Debug: Local State');
    console.log('Raw JSON:', localStorage.getItem(STORAGE_KEY));
    console.log('Parsed State:', state);
    console.groupEnd();
    setToast({ message: 'State dumped to console', type: 'info' });
  };

  // --- Helper for confirmations ---
  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  // --- Actions ---

  const handleCreateProject = (title: string, desc: string) => {
    const id = uid();
    const newProj: Project = {
      id,
      title,
      desc,
      notes: '',
      stages: STAGES.reduce((acc, s) => ({ ...acc, [s.id]: false }), {}),
      expandedStages: {},
      assets: [],
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      projects: { ...prev.projects, [id]: newProj },
      activeProjectId: id
    }));
    setToast({ message: 'Project created', type: 'success' });
  };

  const deleteProject = (id: string) => {
    // Find project to delete for restore capability
    const projectToDelete = state.projects[id];
    if (!projectToDelete) return;

    // Optimistically delete with Undo
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
          activeProjectId: id // Switch back to restored project
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

  const switchProject = (id: string) => setState(prev => ({ ...prev, activeProjectId: id }));

  const toggleStage = (stageId: string) => {
    if (!state.activeProjectId) return;
    setState(prev => {
      const p = prev.projects[prev.activeProjectId!];
      return {
        ...prev,
        projects: {
          ...prev.projects,
          [p.id]: { ...p, stages: { ...p.stages, [stageId]: !p.stages[stageId] } }
        }
      };
    });
  };

  const toggleStageExpanded = (stageId: string) => {
    if (!state.activeProjectId) return;
    setState(prev => {
      const p = prev.projects[prev.activeProjectId!];
      const currentExpanded = p.expandedStages || {};
      return {
        ...prev,
        projects: {
          ...prev.projects,
          [p.id]: { ...p, expandedStages: { ...currentExpanded, [stageId]: !currentExpanded[stageId] } }
        }
      };
    });
  };

  const markAllStages = () => {
    if (!state.activeProjectId) return;
    setState(prev => {
      const p = prev.projects[prev.activeProjectId!];
      const allTrue = STAGES.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
      return {
        ...prev,
        projects: { ...prev.projects, [p.id]: { ...p, stages: allTrue } }
      };
    });
    setToast({ message: 'All stages marked complete', type: 'success' });
  };

  const resetStages = () => {
    if (!state.activeProjectId) return;
    requestConfirm('Reset Progress?', 'This will uncheck all stages.', () => {
      setState(prev => {
        const p = prev.projects[prev.activeProjectId!];
        const allFalse = STAGES.reduce((acc, s) => ({ ...acc, [s.id]: false }), {});
        return {
          ...prev,
          projects: { ...prev.projects, [p.id]: { ...p, stages: allFalse } }
        };
      });
      setToast({ message: 'Progress reset', type: 'info' });
    });
  };

  const updateProjectNotes = useCallback((notes: string) => {
    setState(prev => {
      if (!prev.activeProjectId) return prev;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          [prev.activeProjectId]: { ...prev.projects[prev.activeProjectId], notes }
        }
      };
    });
  }, []);

  // Helper to handle cloud vs local file logic
  const processFile = async (file: File): Promise<Partial<Asset>> => {
    // 1. Check Cloud
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

    // 2. Local
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
    if (!state.activeProjectId) return;

    try {
      const assetData = await processFile(file);
      addAsset(assetData as Asset);
      setToast({ message: 'Asset uploaded', type: 'success' });
    } catch (e) {
      // Error handled in processFile mostly (alert)
    }
  };

  const handleReplaceAsset = async (index: number, file: File) => {
     if (!state.activeProjectId) return;
     
     try {
       const assetData = await processFile(file);
       setState(prev => {
         if (!prev.activeProjectId) return prev;
         const p = prev.projects[prev.activeProjectId];
         const newAssets = [...p.assets];
         // Replace at index, preserving name if desired? Let's overwrite everything for simplicity of "replace"
         // or we could keep the old name if that was the intent. Usually "replace" means update content.
         // Let's update content but keep createdAt if we want "history", but typically replace updates everything.
         newAssets[index] = assetData as Asset;
         
         return {
           ...prev,
           projects: {
             ...prev.projects,
             [p.id]: { ...p, assets: newAssets }
           }
         };
       });
       setToast({ message: 'Asset replaced', type: 'success' });
     } catch (e) {
       // Error handled
     }
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
    requestConfirm('Remove Asset?', 'Are you sure you want to delete this asset?', () => {
      setState(prev => {
        if (!prev.activeProjectId) return prev;
        const p = prev.projects[prev.activeProjectId];
        const newAssets = [...p.assets];
        newAssets.splice(index, 1);
        return {
          ...prev,
          projects: {
            ...prev.projects,
            [p.id]: { ...p, assets: newAssets }
          }
        };
      });
      setToast({ message: 'Asset removed', type: 'info' });
    });
  };

  const handleTemplateInsert = (content: string) => {
    if (!activeProject) return;
    updateProjectNotes((activeProject.notes ? activeProject.notes + "\n\n" : "") + content);
    setToast({ message: 'Template inserted', type: 'success' });
  };

  const clearProjectData = () => {
    requestConfirm('Clear Project Data?', 'This will clear all notes, assets, and progress checklist. This cannot be undone.', () => {
      setState(prev => {
        if (!prev.activeProjectId) return prev;
        const p = prev.projects[prev.activeProjectId];
        return {
          ...prev,
          projects: {
            ...prev.projects,
            [p.id]: { 
              ...p, 
              notes: '', 
              assets: [], 
              stages: STAGES.reduce((a, s) => ({ ...a, [s.id]: false }), {}) 
            }
          }
        };
      });
      setToast({ message: 'Project data cleared', type: 'info' });
    });
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-accent selection:text-surface">
      <header className="h-16 border-b border-white/5 bg-surface/50 backdrop-blur flex items-center px-6 sticky top-0 z-40">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center font-bold text-surface mr-3 shadow-[0_0_15px_rgba(96,165,250,0.3)]">
          UX
        </div>
        <h1 className="font-bold text-lg tracking-tight">UXMate</h1>
        <div className="ml-auto text-xs hidden sm:block cursor-pointer" onClick={dumpLocalState} title="Click to debug local state">
          {fbReady ? (
             <span className="text-success flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-success"></span>
               Cloud Active
             </span>
          ) : (
             <span className="text-muted flex items-center gap-1.5 hover:text-white transition-colors">
               <span className="w-2 h-2 rounded-full bg-slate-500"></span>
               Local Mode — Cloud sync disabled
             </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] mx-auto w-full p-4 md:p-6 gap-6">
        <Sidebar 
          state={state}
          activeProject={activeProject}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          switchProject={switchProject}
          deleteProject={deleteProject}
          duplicateProject={duplicateProject}
          toggleStage={toggleStage}
          toggleStageExpanded={toggleStageExpanded}
          markAllStages={markAllStages}
          resetStages={resetStages}
          onUploadAsset={handleAssetUpload}
        />
        <Workspace 
          project={activeProject}
          updateProject={updateProject}
          updateProjectNotes={updateProjectNotes}
          deleteAsset={deleteAsset}
          onReplaceAsset={handleReplaceAsset}
          openTemplates={() => setIsTemplatesOpen(true)}
          clearProjectData={clearProjectData}
        />
      </div>

      {/* Global Guided Tour */}
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
    </div>
  );
};

export default App;
