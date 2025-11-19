
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
import { IconMenu, IconLayout, IconCheckCircle, IconFile, IconPlus, IconEdit, IconBug, IconTerminal, IconTrash, IconClose } from './components/ui/Icons';

function uid() {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = 'uxmate_projects_v1';
// Warning threshold for LocalStorage usage (~4.5MB is safe limit, browsers usually 5MB)
const STORAGE_WARNING_THRESHOLD = 4.5 * 1024 * 1024; 
// Warning threshold for total asset size (as requested, though mostly relevant if using custom storage)
const ASSET_SIZE_WARNING_THRESHOLD = 30 * 1024 * 1024; 

// Mobile Tabs
type MobileTab = 'projects' | 'editor' | 'checklist' | 'assets';

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
  const [exportProject, setExportProject] = useState<Project | null>(null);
  const [fbReady, setFbReady] = useState(false);
  
  // Mobile Navigation State
  const [mobileTab, setMobileTab] = useState<MobileTab>('projects');

  // Hidden file input for global FAB upload
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast State
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  
  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Dev Mode State
  const [devClickCount, setDevClickCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Persist to localStorage & Check Performance Limits
  useEffect(() => {
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, json);

      // Check 1: LocalStorage Quota (Critical)
      const totalSize = new Blob([json]).size;
      if (totalSize > STORAGE_WARNING_THRESHOLD) {
         if (!toast || toast.type !== 'error') {
           setToast({ 
             message: 'Storage Full! Export projects or delete assets immediately to avoid data loss.', 
             type: 'error' 
           });
         }
      } else {
        // Check 2: Total Asset Size (Performance/Warning)
        // Only count local assets (dataURL) towards local limits, but track total for "heavy" warning
        const totalAssetSize = (Object.values(state.projects) as Project[]).reduce((acc, p) => {
          return acc + p.assets.reduce((sum, a) => sum + (a.size || 0), 0);
        }, 0);

        if (totalAssetSize > ASSET_SIZE_WARNING_THRESHOLD) {
          // Debounce this warning slightly so it doesn't spam
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

    // Cloud Sync Logic
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New Project
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
      // Ctrl/Cmd + E: Export Current
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (state.activeProjectId && state.projects[state.activeProjectId]) {
          setExportProject(state.projects[state.activeProjectId]);
        } else {
          setToast({ message: 'Select a project to export', type: 'info' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.activeProjectId, state.projects]);

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

  // Auto-switch mobile tab to Editor when project changes
  useEffect(() => {
    if (state.activeProjectId) {
      // Only switch if we are currently in 'projects' view on mobile, otherwise stay where user is
      if (mobileTab === 'projects') {
        setMobileTab('editor');
      }
    }
  }, [state.activeProjectId]);

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
    setMobileTab('editor'); // Switch to editor
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
      const p = prev.projects[prev.activeProjectId];
      
      const currentVersion: ProjectVersion = {
        timestamp: new Date().toISOString(),
        notes: p.notes
      };
      
      const newHistory = [currentVersion, ...(p.history || [])].slice(0, 3);

      return {
        ...prev,
        projects: {
          ...prev.projects,
          [p.id]: { ...p, notes, history: newHistory }
        }
      };
    });
  }, []);

  const restoreProjectVersion = useCallback((version: ProjectVersion) => {
    setState(prev => {
      if (!prev.activeProjectId) return prev;
      const p = prev.projects[prev.activeProjectId];
      
      const currentVersion: ProjectVersion = {
        timestamp: new Date().toISOString(),
        notes: p.notes
      };
      const newHistory = [currentVersion, ...(p.history || [])].slice(0, 3);

      return {
        ...prev,
        projects: {
          ...prev.projects,
          [p.id]: { ...p, notes: version.notes, history: newHistory }
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
    if (!state.activeProjectId) return;
    try {
      const assetData = await processFile(file);
      addAsset(assetData as Asset);
      setToast({ message: 'Asset uploaded', type: 'success' });
    } catch (e) { }
  };

  const handleGlobalUploadTrigger = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleReplaceAsset = async (index: number, file: File) => {
     if (!state.activeProjectId) return;
     try {
       const assetData = await processFile(file);
       setState(prev => {
         if (!prev.activeProjectId) return prev;
         const p = prev.projects[prev.activeProjectId];
         const newAssets = [...p.assets];
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

  const handleOpenExport = (project: Project) => {
    setExportProject(project);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  // Dev Mode Handler
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

  // --- Render ---

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-accent selection:text-surface">
      <header className="h-16 border-b border-white/5 bg-surface/50 backdrop-blur flex items-center px-6 sticky top-0 z-40 shrink-0">
        <div 
          className="w-8 h-8 rounded bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center font-bold text-surface mr-3 shadow-[0_0_15px_rgba(96,165,250,0.3)] select-none cursor-pointer active:scale-95 transition-transform"
          onClick={handleLogoClick}
        >
          UX
        </div>
        <h1 className="font-bold text-lg tracking-tight">UXMate</h1>
        <div className="ml-auto text-xs flex items-center gap-3">
          {/* Dev Mode Toggle */}
          {isDevMode && (
            <button 
              onClick={() => setIsDebugOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              title="Open Debug Panel"
            >
              <IconBug className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Debug</span>
            </button>
          )}
          
          <div className="hidden sm:block">
            {fbReady ? (
              <span className="text-success flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                Cloud Active
              </span>
            ) : (
              <span className="text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Local
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] mx-auto w-full md:p-6 md:gap-6 relative">
        
        {/* Sidebar: Visible on Desktop OR specific section on Mobile */}
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
          onExport={handleOpenExport}
          className={`${mobileTab !== 'editor' ? 'flex' : 'hidden'} md:flex p-4 md:p-0 h-full md:h-auto overflow-y-auto md:overflow-visible`}
          mobileSection={mobileTab}
        />

        {/* Workspace: Visible on Desktop OR 'editor' on Mobile */}
        <Workspace 
          project={activeProject}
          updateProject={updateProject}
          updateProjectNotes={updateProjectNotes}
          restoreProjectVersion={restoreProjectVersion}
          deleteAsset={deleteAsset}
          onReplaceAsset={handleReplaceAsset}
          openTemplates={() => setIsTemplatesOpen(true)}
          clearProjectData={clearProjectData}
          onExport={handleOpenExport}
          className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex p-4 md:p-0 h-full md:h-auto overflow-y-auto md:overflow-visible`}
        />
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 h-16 flex items-center justify-around z-50 pb-safe">
           <button onClick={() => setMobileTab('projects')} className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'projects' ? 'text-accent' : 'text-muted'}`}>
             <IconMenu className="w-6 h-6" />
             <span className="text-[10px] font-medium">Projects</span>
           </button>
           <button onClick={() => setMobileTab('editor')} className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'editor' ? 'text-accent' : 'text-muted'}`}>
             <IconEdit className="w-6 h-6" />
             <span className="text-[10px] font-medium">Editor</span>
           </button>
           <button onClick={() => setMobileTab('checklist')} className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'checklist' ? 'text-accent' : 'text-muted'}`}>
             <IconCheckCircle className="w-6 h-6" />
             <span className="text-[10px] font-medium">Checklist</span>
           </button>
           <button onClick={() => setMobileTab('assets')} className={`flex flex-col items-center gap-1 p-2 flex-1 ${mobileTab === 'assets' ? 'text-accent' : 'text-muted'}`}>
             <IconFile className="w-6 h-6" />
             <span className="text-[10px] font-medium">Assets</span>
           </button>
        </div>

        {/* Mobile Floating Action Button (FAB) */}
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          {mobileTab === 'projects' && (
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="w-14 h-14 rounded-full bg-accent text-surface shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform active:scale-95"
              aria-label="New Project"
            >
              <IconPlus className="w-7 h-7" />
            </button>
          )}
          {mobileTab === 'assets' && activeProject && (
            <button 
              onClick={handleGlobalUploadTrigger} 
              className="w-14 h-14 rounded-full bg-accent text-surface shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform active:scale-95"
              aria-label="Upload Asset"
            >
              <IconPlus className="w-7 h-7" />
            </button>
          )}
          {mobileTab === 'editor' && activeProject && (
            <button 
              onClick={() => setIsTemplatesOpen(true)} 
              className="w-14 h-14 rounded-full bg-surface border border-accent text-accent shadow-lg flex items-center justify-center transition-transform active:scale-95"
              aria-label="Insert Template"
            >
              <IconLayout className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Global Hidden Input for FAB Asset Upload */}
      <input 
        type="file" 
        ref={hiddenFileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          if(e.target.files?.[0]) {
            handleAssetUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

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

      {/* DEBUG PANEL (Dev Mode) */}
      {isDebugOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-surface border border-white/10 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <IconTerminal className="w-5 h-5 text-accent" /> Developer Tools
                </h2>
                <button onClick={() => setIsDebugOpen(false)} className="text-muted hover:text-white">
                  <IconClose className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-[#1e1e1e] p-4 font-mono text-xs text-green-400">
                <div className="h-full overflow-auto">
                  <pre>{JSON.stringify(state, null, 2)}</pre>
                </div>
              </div>
              <div className="p-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-muted">
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

export default App;
