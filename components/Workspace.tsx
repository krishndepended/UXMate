import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectVersion } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconDownload, IconTrash, IconFile, IconEdit, IconReplace, IconHistory, IconCheck, IconChevronDown, IconRefresh, IconCheckCircle, IconPlus } from './ui/Icons';
import { ProgressRing } from './ui/ProgressRing';
import { AssetCard } from './ui/AssetCard';
import { ContextMenu } from './ui/ContextMenu';
import { HistoryModal } from './HistoryModal';

interface WorkspaceProps {
  project: Project | null;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProjectNotes: (notes: string) => void;
  restoreProjectVersion: (version: ProjectVersion) => void;
  deleteAsset: (index: number) => void;
  onReplaceAsset: (index: number, file: File) => void;
  openTemplates: () => void;
  clearProjectData: () => void;
  onExport: (project: Project) => void;
  className?: string;
  
  // New Props for Mobile Interactions
  toggleStage?: (stageId: string) => void;
  toggleStageExpanded?: (stageId: string) => void;
  markAllStages?: () => void;
  resetStages?: () => void;
  onUploadAsset?: (file: File) => void;
}

type MobileTab = 'notes' | 'checklist' | 'assets';

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  updateProject,
  updateProjectNotes,
  restoreProjectVersion,
  deleteAsset,
  onReplaceAsset,
  openTemplates,
  clearProjectData,
  onExport,
  className = '',
  toggleStage,
  toggleStageExpanded,
  markAllStages,
  resetStages,
  onUploadAsset
}) => {
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'modified'>('idle');
  const [mobileTab, setMobileTab] = useState<MobileTab>('notes');
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescVal, setEditDescVal] = useState('');

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    assetIndex: number;
  } | null>(null);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const notesRef = useRef(notes);

  useEffect(() => {
    if (project) {
      setNotes(project.notes || '');
      notesRef.current = project.notes || '';
    }
  }, [project?.id, project?.notes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setNotes(newVal);
    notesRef.current = newVal;
    if (saveStatus !== 'modified' && newVal !== project?.notes) {
      setSaveStatus('modified');
    }
  };

  const handleSave = useCallback(() => {
    if (!project) return;
    setSaveStatus('saving');
    setTimeout(() => {
      updateProjectNotes(notesRef.current);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, [project, updateProjectNotes]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (notesRef.current !== project?.notes) {
        handleSave();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [handleSave, project?.notes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const startEditTitle = () => {
    if (!project) return;
    setEditTitleVal(project.title);
    setIsEditingTitle(true);
  };
  
  const saveTitle = () => {
    if (!project) return;
    if (editTitleVal.trim() && editTitleVal !== project.title) {
      updateProject(project.id, { title: editTitleVal });
    }
    setIsEditingTitle(false);
  };

  const startEditDesc = () => {
    if (!project) return;
    setEditDescVal(project.desc);
    setIsEditingDesc(true);
  };
  
  const saveDesc = () => {
    if (!project) return;
    if (editDescVal !== project.desc) {
      updateProject(project.id, { desc: editDescVal });
    }
    setIsEditingDesc(false);
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;
    setContextMenu({
      isOpen: true,
      x,
      y,
      assetIndex: index
    });
  };

  const handleReplaceClick = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  const onReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && replaceIndex !== null) {
      onReplaceAsset(replaceIndex, e.target.files[0]);
      setReplaceIndex(null);
      e.target.value = ''; 
    }
  };

  if (!project) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm min-h-[500px] mx-4 md:mx-0 ${className}`} role="main">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <IconFile className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Project Selected</h2>
        <p className="text-slate-500 max-w-md">Create a new project or select one from the sidebar to start working on your case study.</p>
      </div>
    );
  }

  const completedStages = Object.values(project.stages).filter(Boolean).length;
  const progress = Math.round((completedStages / STAGES.length) * 100);

  return (
    <main className={`flex-1 flex flex-col gap-4 md:gap-6 min-w-0 ${className}`} role="main">
      {/* Header Card */}
      <div className="bg-white md:border border-slate-200 rounded-none md:rounded-xl p-4 md:p-6 shadow-sm flex flex-col gap-4 -mx-6 md:mx-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-4 w-full">
            <div aria-label={`Project progress: ${progress}%`}>
               <ProgressRing progress={progress} radius={24} stroke={4} className="flex-shrink-0 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 group">
                {isEditingTitle ? (
                  <input 
                    autoFocus
                    type="text"
                    className="text-xl md:text-2xl font-bold text-slate-900 bg-white border border-blue-500 rounded px-2 py-0.5 w-full outline-none min-h-[44px]"
                    value={editTitleVal}
                    onChange={e => setEditTitleVal(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={e => e.key === 'Enter' && saveTitle()}
                    aria-label="Edit Project Title"
                  />
                ) : (
                  <h1 
                    className="text-xl md:text-2xl font-bold text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors border border-transparent hover:border-slate-200 rounded px-1 -ml-1"
                    onDoubleClick={startEditTitle}
                    title="Double click to edit title"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && startEditTitle()}
                  >
                    {project.title}
                  </h1>
                )}
                {!isEditingTitle && (
                   <button onClick={startEditTitle} className="md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-2 md:p-1" aria-label="Edit title">
                     <IconEdit className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
                   </button>
                )}
              </div>

              <div className="mt-1 group flex items-center gap-2">
                 {isEditingDesc ? (
                   <input 
                    autoFocus
                    type="text"
                    className="text-sm text-slate-600 bg-white border border-blue-500 rounded px-2 py-0.5 w-full max-w-md outline-none min-h-[44px]"
                    value={editDescVal}
                    onChange={e => setEditDescVal(e.target.value)}
                    onBlur={saveDesc}
                    onKeyDown={e => e.key === 'Enter' && saveDesc()}
                    aria-label="Edit Project Description"
                   />
                 ) : (
                   <p 
                     className="text-slate-500 text-sm cursor-pointer hover:text-slate-800 transition-colors border border-transparent hover:border-slate-200 rounded px-1 -ml-1 truncate"
                     onDoubleClick={startEditDesc}
                     title="Double click to edit description"
                     tabIndex={0}
                     onKeyDown={e => e.key === 'Enter' && startEditDesc()}
                   >
                     {project.desc || 'No description provided.'}
                   </p>
                 )}
                 {!isEditingDesc && (
                   <button onClick={startEditDesc} className="md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-2 md:p-1" aria-label="Edit description">
                     <IconEdit className="w-4 h-4 md:w-3.5 md:h-3.5" aria-hidden="true" />
                   </button>
                 )}
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex gap-3 flex-wrap w-full md:w-auto justify-end">
            <Button id="tour-templates" variant="ghost" onClick={openTemplates} aria-label="Open templates library" className="flex-1 md:flex-none">Templates</Button>
            <Button 
              variant="ghost" 
              className="text-slate-600 hover:text-slate-900 flex-1 md:flex-none"
              onClick={() => setIsHistoryOpen(true)}
              title="View History"
            >
              <IconHistory className="w-4 h-4 mr-1" /> History
            </Button>
            <Button 
              id="tour-export"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-sm hover:shadow border-0 flex-1 md:flex-none"
              onClick={() => onExport(project)}
              aria-label="Open export options"
            >
              <IconDownload className="w-4 h-4" aria-hidden="true" /> Export
            </Button>
          </div>
        </div>

        {/* Mobile Tabs (Pills) */}
        <div className="flex md:hidden bg-slate-100 p-1 rounded-xl mx-4">
          <button 
            onClick={() => setMobileTab('notes')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mobileTab === 'notes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setMobileTab('checklist')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mobileTab === 'checklist' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Checklist
          </button>
          <button 
            onClick={() => setMobileTab('assets')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mobileTab === 'assets' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Assets
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mx-4 md:mx-0">
        
        {/* Left Column (Editor) - Visible on Mobile if 'notes', always on Desktop */}
        <div className={`lg:col-span-2 flex flex-col gap-6 ${mobileTab === 'notes' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Notes Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-1 flex flex-col relative min-h-[50vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <label htmlFor="notes" className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Project Notes</label>
              <div className={`text-xs font-medium transition-colors flex items-center gap-1.5 ${
                saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'saving' ? 'text-blue-600' : saveStatus === 'modified' ? 'text-amber-500' : 'text-slate-400'
              }`} role="status">
                 <div className={`w-1.5 h-1.5 rounded-full ${
                    saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'saving' ? 'bg-blue-500 animate-pulse' : saveStatus === 'modified' ? 'bg-amber-500' : 'bg-slate-400'
                 }`}></div>
                 {saveStatus === 'saving' ? 'Autosaving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'modified' ? 'Unsaved' : 'Saved'}
              </div>
            </div>
            <textarea
              id="notes"
              value={notes}
              onChange={handleNotesChange}
              onBlur={handleSave} 
              placeholder="Start typing your problem statement, research notes, or findings here..."
              className="w-full flex-1 bg-transparent p-6 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset text-slate-700 leading-relaxed min-h-[300px] text-base font-sans"
              aria-label="Project notes"
            />
            <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <Button variant="danger" size="sm" onClick={clearProjectData} aria-label="Clear all project data">Clear Data</Button>
            </div>
          </div>
        </div>

        {/* Right Column (Progress & Assets) - Hidden on Mobile (logic handled below), visible Desktop */}
        <div className="hidden lg:flex flex-col gap-6 min-w-0">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-slate-900">Progress</h3>
               <span className="text-xs font-mono text-blue-600">{progress}%</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Project completion progress">
               <div 
                 className="h-full bg-blue-600 transition-all duration-500"
                 style={{ width: `${progress}%` }}
               />
             </div>
             <div className="mt-2 text-xs text-slate-500 text-right">{completedStages} of {STAGES.length} stages completed</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col min-h-[300px]">
            <h3 className="font-bold text-slate-900 mb-4">Project Assets</h3>
            
            {project.assets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 text-center border border-dashed border-slate-200 rounded-lg">
                No assets uploaded yet.
              </div>
            ) : (
              <div className="flex-1 relative min-w-0">
                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ contentVisibility: 'auto' }}>
                   <div className="grid grid-cols-2 gap-3" role="list" aria-label="Uploaded assets">
                     {[...project.assets].reverse().map((asset, index) => {
                       const originalIndex = project.assets.length - 1 - index;
                       return (
                         <div role="listitem" key={index}>
                           <AssetCard 
                             asset={asset}
                             onClick={() => {
                               const url = asset.url || asset.dataURL;
                               if(url) window.open(url, '_blank');
                             }}
                             onContextMenu={(e) => handleContextMenu(e, originalIndex)}
                             onMoreClick={(e) => handleContextMenu(e, originalIndex)}
                           />
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile ONLY Views: Checklist & Assets */}
        
        {/* Mobile Checklist View */}
        <div className={`lg:hidden flex-col gap-4 ${mobileTab === 'checklist' ? 'flex' : 'hidden'}`}>
           <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Checklist</h3>
                <div className="flex gap-2">
                  {markAllStages && (
                    <Button size="sm" variant="ghost" onClick={markAllStages}><IconCheckCircle className="w-4 h-4" /></Button>
                  )}
                  {resetStages && (
                    <Button size="sm" variant="ghost" onClick={resetStages}><IconRefresh className="w-4 h-4" /></Button>
                  )}
                </div>
             </div>
             <div className="space-y-1">
              {STAGES.map((stage, idx) => {
                  const isDone = project.stages[stage.id];
                  const isExpanded = project.expandedStages?.[stage.id];
                  return (
                    <div 
                      key={stage.id} 
                      className={`rounded-lg transition-all duration-200 ${
                        isExpanded ? 'bg-slate-50 border border-slate-200 pb-2' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 p-2 min-h-[44px]">
                         {toggleStageExpanded && (
                          <button
                            onClick={() => toggleStageExpanded(stage.id)}
                            className={`p-2 text-slate-400 hover:text-slate-800 rounded ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            <IconChevronDown className="w-4 h-4" />
                          </button>
                         )}
                         <label className="flex-1 flex items-center gap-3 cursor-pointer h-full" onClick={e => e.stopPropagation()}>
                            <div className="pt-0.5">
                              <input 
                                type="checkbox" 
                                checked={!!isDone}
                                onChange={() => toggleStage && toggleStage(stage.id)}
                                className="sr-only"
                              />
                              <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {isDone && <IconCheck className="w-4 h-4 stroke-[3]" />}
                              </div>
                            </div>
                            <div className="flex-1 py-1">
                               <div className={`text-base font-medium ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>{stage.label}</div>
                            </div>
                         </label>
                      </div>
                      {isExpanded && <div className="px-9 pb-2 text-sm text-slate-600">{stage.help}</div>}
                    </div>
                  );
              })}
             </div>
           </div>
        </div>

        {/* Mobile Assets View */}
        <div className={`lg:hidden flex-col gap-4 ${mobileTab === 'assets' ? 'flex' : 'hidden'}`}>
           <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm min-h-[50vh]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-900">Assets</h3>
               <label className="cursor-pointer">
                 <input type="file" className="hidden" accept="image/*" capture="environment" onChange={e => e.target.files?.[0] && onUploadAsset && onUploadAsset(e.target.files[0])} />
                 <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-bold shadow-sm min-h-[44px] active:scale-95 transition-transform">
                   <IconPlus className="w-4 h-4 mr-1" /> Upload New
                 </span>
               </label>
             </div>
             <div className="grid grid-cols-2 gap-3">
               {project.assets.length === 0 ? (
                 <div className="col-span-2 text-center py-10 text-slate-500 italic border border-dashed rounded-lg">No assets yet.</div>
               ) : (
                 [...project.assets].reverse().map((asset, index) => {
                   const originalIndex = project.assets.length - 1 - index;
                   return (
                     <AssetCard 
                       key={index} 
                       asset={asset} 
                       onClick={() => {
                          const url = asset.url || asset.dataURL;
                          if(url) window.open(url, '_blank');
                       }}
                       onContextMenu={(e) => handleContextMenu(e, originalIndex)} 
                       onMoreClick={(e) => handleContextMenu(e, originalIndex)}
                     />
                   );
                 })
               )}
             </div>
           </div>
        </div>

      </div>
      
      <input 
        type="file"
        ref={replaceInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={onReplaceFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      <ContextMenu 
        isOpen={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        items={[
          {
            label: 'Open / Download',
            icon: <IconDownload className="w-4 h-4" />,
            onClick: () => {
               if(contextMenu && project.assets[contextMenu.assetIndex]) {
                 const a = project.assets[contextMenu.assetIndex];
                 const url = a.url || a.dataURL;
                 if(url) {
                   const link = document.createElement('a');
                   link.href = url;
                   link.download = a.name;
                   link.target = '_blank';
                   link.click();
                 }
               }
            }
          },
          {
            label: 'Replace Asset',
            icon: <IconReplace className="w-4 h-4" />,
            onClick: () => {
              if (contextMenu) handleReplaceClick(contextMenu.assetIndex);
            }
          },
          {
            label: 'Delete Asset',
            icon: <IconTrash className="w-4 h-4" />,
            danger: true,
            onClick: () => {
              if (contextMenu) deleteAsset(contextMenu.assetIndex);
            }
          }
        ]}
      />

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={project.history || []}
        onRestore={restoreProjectVersion}
      />
    </main>
  );
};