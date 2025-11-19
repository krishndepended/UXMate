
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectVersion } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconDownload, IconTrash, IconFile, IconEdit, IconReplace, IconHistory, IconCheck, IconArrowRight, IconPlus, IconLayout } from './ui/Icons';
import { ProgressRing } from './ui/ProgressRing';
import { AssetCard } from './ui/AssetCard';
import { ContextMenu } from './ui/ContextMenu';
import { HistoryModal } from './HistoryModal';
import { generateFullHtml } from '../utils/exporter'; // For case study preview

interface WorkspaceProps {
  project: Project | null;
  updateProject: (id: string, updates: Partial<Project>) => void;
  // New: Update a specific step
  updateStepData: (stepId: string, data: { notes: string; isComplete: boolean }) => void;
  restoreProjectVersion: (version: ProjectVersion) => void;
  deleteAsset: (index: number) => void;
  onReplaceAsset: (index: number, file: File) => void;
  onUploadAsset: (file: File) => void;
  openTemplates: () => void;
  onExport: (project: Project) => void;
  
  // Navigation
  currentStepId: string;
  onStepSelect: (stepId: string) => void;
  className?: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  updateProject,
  updateStepData,
  restoreProjectVersion,
  deleteAsset,
  onReplaceAsset,
  onUploadAsset,
  openTemplates,
  onExport,
  currentStepId,
  onStepSelect,
  className = '',
}) => {
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'modified'>('idle');
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    assetIndex: number;
  } | null>(null);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const notesRef = useRef(notes);

  // Get current stage definition
  const currentStage = STAGES.find(s => s.id === currentStepId) || STAGES[0];
  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const nextStep = STAGES[currentStepIndex + 1];
  const prevStep = STAGES[currentStepIndex - 1];

  // Sync local state when project or step changes
  useEffect(() => {
    if (project) {
      // Ensure step exists, if not fallback (backward compat handled in app state, but safe check here)
      const stepData = project.steps?.[currentStepId] || { notes: '', isComplete: false };
      
      // Special backward compatibility: If Step 1 (Problem) is empty, check legacy global notes
      let initialNotes = stepData.notes;
      if (currentStepId === 'problem' && !initialNotes && project.notes) {
        initialNotes = project.notes;
      }

      setNotes(initialNotes);
      notesRef.current = initialNotes;
    }
  }, [project?.id, currentStepId, project?.steps]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setNotes(newVal);
    notesRef.current = newVal;
    setSaveStatus('modified');
  };

  const handleSave = useCallback(() => {
    if (!project) return;
    setSaveStatus('saving');
    
    // Persist to the step data structure
    const currentIsComplete = project.steps?.[currentStepId]?.isComplete || false;
    
    setTimeout(() => {
      updateStepData(currentStepId, {
        notes: notesRef.current,
        isComplete: currentIsComplete // Keep existing status, specific toggle for completion
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, [project, currentStepId, updateStepData]);

  // Autosave interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (saveStatus === 'modified') {
        handleSave();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [handleSave, saveStatus]);

  // Ctrl+S
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

  const toggleStepCompletion = () => {
    if (!project) return;
    const isComplete = project.steps?.[currentStepId]?.isComplete || false;
    updateStepData(currentStepId, {
      notes: notes,
      isComplete: !isComplete
    });
  };

  const handleNextStep = () => {
    // Mark current as complete if notes exist and not already complete
    if (project && notes.trim().length > 10 && !project.steps?.[currentStepId]?.isComplete) {
        updateStepData(currentStepId, { notes, isComplete: true });
    }
    if (nextStep) onStepSelect(nextStep.id);
  };

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

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, assetIndex: index });
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
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
          <IconFile className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">No Project Selected</h2>
        <p className="text-slate-500 max-w-sm leading-relaxed">Create a new project or select one from the sidebar.</p>
      </div>
    );
  }

  const isStepComplete = project.steps?.[currentStepId]?.isComplete;
  const completedStepsCount = STAGES.filter(s => project.steps?.[s.id]?.isComplete).length;
  const progress = Math.round((completedStepsCount / STAGES.length) * 100);

  // Filter assets for current step
  const stepAssets = project.assets.filter(a => {
      if (a.stepId === currentStepId) return true;
      // Backward compatibility: untagged assets show in 'problem' (Step 1)
      if (currentStepId === 'problem' && !a.stepId) return true;
      return false;
  });

  // CASE STUDY VIEW (Step 12)
  if (currentStepId === 'casestudy') {
    const previewHtml = generateFullHtml(project, true);
    return (
      <main className={`flex-1 flex flex-col gap-6 min-w-0 ${className}`}>
         {/* Header */}
         <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Case Study Preview</h1>
                <p className="text-slate-500 text-sm mt-1">Compile all your steps into a final report.</p>
            </div>
            <Button onClick={() => onExport(project)} className="bg-slate-900 text-white">
                <IconDownload className="w-4 h-4 mr-2" /> Export / Print
            </Button>
         </div>

         <div className="flex-1 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner">
            <iframe 
                 srcDoc={previewHtml} 
                 title="Case Study Preview"
                 className="w-full h-full border-0 bg-white"
                 sandbox="allow-same-origin"
            />
         </div>
         
         <div className="flex justify-between pb-6">
            <Button variant="outline" onClick={() => onStepSelect(prevStep.id)}>Back to Iteration</Button>
         </div>
      </main>
    );
  }

  return (
    <main className={`flex-1 flex flex-col gap-6 min-w-0 ${className}`} role="main">
      {/* 1. Step Header */}
      <div className="bg-white border border-slate-200 rounded-none md:rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Step {currentStepIndex + 1} of {STAGES.length}</div>
            <h1 className="text-2xl font-bold text-slate-900">{currentStage.label.replace(/^\d+\.\s/, '')}</h1>
            <p className="text-slate-600 mt-1 max-w-2xl">{currentStage.description}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</div>
                <div className="font-mono text-blue-600 font-bold">{progress}%</div>
             </div>
             <ProgressRing progress={progress} radius={24} stroke={4} className="text-blue-600" />
          </div>
        </div>
        
        {/* Project Title Context */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
             <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Project:</span>
             {isEditingTitle ? (
                 <input 
                   autoFocus
                   type="text"
                   className="text-sm font-bold text-slate-900 bg-white border-b border-blue-500 outline-none"
                   value={editTitleVal}
                   onChange={e => setEditTitleVal(e.target.value)}
                   onBlur={saveTitle}
                   onKeyDown={e => e.key === 'Enter' && saveTitle()}
                 />
               ) : (
                 <span 
                   className="text-sm font-bold text-slate-700 cursor-pointer hover:text-blue-600"
                   onDoubleClick={startEditTitle}
                 >
                   {project.title}
                 </span>
            )}
             <button onClick={() => setIsHistoryOpen(true)} className="ml-auto text-xs text-slate-400 hover:text-slate-800 flex items-center gap-1">
                <IconHistory className="w-3 h-3" /> History
             </button>
        </div>
      </div>

      {/* 2. Content Area: Notes & Assets */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Editor */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col relative overflow-hidden">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
               <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={openTemplates} className="text-blue-600 hover:bg-blue-50">
                     <IconLayout className="w-4 h-4 mr-1.5" /> Insert Template
                  </Button>
               </div>
               <div className={`text-xs font-medium transition-colors flex items-center gap-2 ${
                  saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'saving' ? 'text-blue-600' : saveStatus === 'modified' ? 'text-amber-500' : 'text-slate-400'
                }`}>
                   {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'modified' ? 'Unsaved' : ''}
               </div>
            </div>

            <textarea
              value={notes}
              onChange={handleNotesChange}
              onBlur={handleSave} 
              placeholder={`Write your ${currentStage.label.toLowerCase().replace(/^\d+\.\s/, '')} notes here...\n\n${currentStage.help}`}
              className="w-full flex-1 bg-white p-8 resize-none focus:outline-none text-slate-700 leading-relaxed text-base font-sans"
            />
          </div>
        </div>

        {/* Right: Assets & Actions */}
        <div className="flex flex-col gap-6">
           
           {/* Step Actions */}
           <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Step Status</h3>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                 <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isStepComplete ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                    {isStepComplete && <IconCheck className="w-4 h-4" />}
                 </div>
                 <input type="checkbox" className="hidden" checked={!!isStepComplete} onChange={toggleStepCompletion} />
                 <div className="text-sm font-medium text-slate-700">Mark as Complete</div>
              </label>
           </div>

           {/* Assets Panel */}
           <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-slate-900 text-sm">Assets</h3>
                    <p className="text-xs text-slate-500">For this step</p>
                </div>
                <label className="cursor-pointer">
                   <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <IconPlus className="w-4 h-4" />
                   </div>
                </label>
              </div>

              {stepAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 text-slate-400 text-sm min-h-[150px]">
                   <IconFile className="w-8 h-8 mb-2 opacity-50" />
                   No assets yet.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                   {[...stepAssets].reverse().map((asset, i) => {
                       const originalIndex = project.assets.indexOf(asset);
                       return (
                           <div key={i}>
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
              )}
           </div>
        </div>
      </div>

      {/* 3. Navigation Footer */}
      <div className="sticky bottom-0 md:static bg-white/90 md:bg-transparent backdrop-blur p-4 md:p-0 border-t md:border-0 border-slate-200 flex justify-between items-center z-20">
         {prevStep ? (
             <Button variant="outline" onClick={() => onStepSelect(prevStep.id)}>Back</Button>
         ) : (
             <div></div>
         )}
         
         <div className="flex gap-2">
            {nextStep ? (
                <Button onClick={handleNextStep} className="pl-6 pr-4">
                    Next Step <IconArrowRight className="w-4 h-4 ml-2" />
                </Button>
            ) : (
                <Button onClick={() => onStepSelect('casestudy')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    View Case Study
                </Button>
            )}
         </div>
      </div>

      {/* Hidden Helpers */}
      <input type="file" ref={replaceInputRef} className="hidden" accept="image/*" onChange={onReplaceFileChange} />
      
      <ContextMenu 
        isOpen={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        items={[
          {
            label: 'Download',
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
            label: 'Replace',
            icon: <IconReplace className="w-4 h-4" />,
            onClick: () => contextMenu && handleReplaceClick(contextMenu.assetIndex)
          },
          {
            label: 'Delete',
            icon: <IconTrash className="w-4 h-4" />,
            danger: true,
            onClick: () => contextMenu && deleteAsset(contextMenu.assetIndex)
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
