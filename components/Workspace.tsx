import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectVersion, ExportConfig, Asset } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconDownload, IconTrash, IconFile, IconReplace, IconHistory, IconCheck, IconArrowRight, IconLayout, IconMoreVertical, IconPlus, IconEye } from './ui/Icons';
import { ProgressRing } from './ui/ProgressRing';
import { AssetCard } from './ui/AssetCard';
import { ContextMenu } from './ui/ContextMenu';
import { HistoryModal } from './HistoryModal';
import { GuideModal } from './GuideModal';
import { generateFullHtml } from '../utils/exporter';
import { parseMarkdown } from '../utils/pdfTemplate';

interface WorkspaceProps {
  project: Project | null;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateStepData: (stepId: string, data: { notes: string; isComplete: boolean }) => void;
  restoreProjectVersion: (version: ProjectVersion) => void;
  deleteAsset: (index: number) => void;
  onReplaceAsset: (index: number, file: File) => void;
  onUploadAsset: (file: File) => void;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  onExport: (project: Project) => void;
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
  isGuideOpen,
  setIsGuideOpen,
  onExport,
  currentStepId,
  onStepSelect,
  className = '',
}) => {
  const [notes, setNotes] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'modified'>('idle');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; assetIndex: number; } | null>(null);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const notesRef = useRef(notes);

  const currentStage = STAGES.find(s => s.id === currentStepId) || STAGES[0];
  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const nextStep = STAGES[currentStepIndex + 1];
  const prevStep = STAGES[currentStepIndex - 1];

  useEffect(() => {
    if (project && project.steps) {
      const stepData = project.steps[currentStepId] || { notes: '', isComplete: false };
      let externalNotes = stepData.notes;
      if (currentStepId === 'problem' && !externalNotes && project.notes) {
        externalNotes = project.notes;
      }
      if (externalNotes !== notesRef.current) {
        setNotes(externalNotes);
        notesRef.current = externalNotes;
      }
    }
  }, [project?.id, currentStepId, project?.steps?.[currentStepId]?.notes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setNotes(newVal);
    notesRef.current = newVal;
    setSaveStatus('modified');
  };

  const handleSave = useCallback(() => {
    if (!project || !project.steps) return;
    setSaveStatus('saving');
    const currentIsComplete = project.steps[currentStepId]?.isComplete || false;
    setTimeout(() => {
      updateStepData(currentStepId, { notes: notesRef.current, isComplete: currentIsComplete });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  }, [project, currentStepId, updateStepData]);

  useEffect(() => {
    const intervalId = setInterval(() => { if (saveStatus === 'modified') handleSave(); }, 5000);
    return () => clearInterval(intervalId);
  }, [handleSave, saveStatus]);

  const toggleStepCompletion = () => {
    if (!project || !project.steps) return;
    const isComplete = project.steps[currentStepId]?.isComplete || false;
    updateStepData(currentStepId, { notes, isComplete: !isComplete });
  };

  const handleInsert = (content: string) => {
    const newNotes = notes.trim() ? notes + "\n\n" + content : content;
    setNotes(newNotes);
    notesRef.current = newNotes;
    setSaveStatus('modified');
    handleSave();
  };

  const updateExportConfig = (updates: Partial<ExportConfig>) => {
    if (!project) return;
    const current = project.exportConfig || {
      theme: 'modern',
      primaryColor: '#3B82F6',
      fontFamily: 'Inter',
      showCover: true,
      showTOC: true,
      showAssets: true,
      designerName: '',
      designerRole: 'UX Designer',
      excludedSteps: []
    };
    updateProject(project.id, { exportConfig: { ...current, ...updates } });
  };

  const saveTitle = () => {
    if (project && editTitleVal.trim() && editTitleVal !== project.title) {
      updateProject(project.id, { title: editTitleVal });
    }
    setIsEditingTitle(false);
  };

  const handleAssetCaptionChange = (index: number, caption: string) => {
    if (!project) return;
    const updatedAssets = [...project.assets];
    updatedAssets[index] = { ...updatedAssets[index], caption };
    updateProject(project.id, { assets: updatedAssets });
  };

  if (!project) return (
    <div className={`flex-1 flex flex-col items-center justify-center p-10 text-center ${className}`}>
      <IconFile className="w-12 h-12 text-slate-200 mb-4" />
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Select a Project</h2>
      <p className="text-slate-500 max-w-xs text-sm">Choose or create a project to start documenting your design process.</p>
    </div>
  );

  const isStepComplete = project.steps?.[currentStepId]?.isComplete;
  const progress = project.steps ? Math.round((STAGES.filter(s => project.steps?.[s.id]?.isComplete).length / STAGES.length) * 100) : 0;
  const stepAssets = project.assets ? project.assets.filter(a => (a.stepId === currentStepId) || (currentStepId === 'problem' && !a.stepId)) : [];

  if (currentStepId === 'casestudy') {
    const previewHtml = generateFullHtml(project, true);
    const config = project.exportConfig || { theme: 'modern', primaryColor: '#3B82F6', fontFamily: 'Inter', showCover: true, showTOC: true, showAssets: true, designerName: '', designerRole: 'UX Designer', excludedSteps: [] };

    return (
      <main className={`flex-1 flex flex-col gap-4 md:gap-6 min-w-0 h-full ${className}`}>
        <div className="bg-white border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-soft flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold">Export Studio</h1>
            <p className="text-xs text-slate-400">Customize layout & branding</p>
          </div>
          <Button onClick={() => onExport(project)} className="bg-blue-600 rounded-full shadow-lg shadow-blue-500/20 px-6">
            <IconDownload className="w-4 h-4 mr-2" /> Download Document
          </Button>
        </div>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-6 overflow-hidden">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-soft flex flex-col gap-6 overflow-y-auto">
             <section>
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Designer Info</h3>
                <div className="space-y-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Your Name</label>
                      <input type="text" placeholder="Design Lead Name" className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10" value={config.designerName} onChange={e => updateExportConfig({ designerName: e.target.value })} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Professional Title</label>
                      <input type="text" placeholder="e.g. Senior UX Designer" className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10" value={config.designerRole} onChange={e => updateExportConfig({ designerRole: e.target.value })} />
                   </div>
                </div>
             </section>

             <section>
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Presentation Style</h3>
                <div className="grid grid-cols-1 gap-2 mb-4">
                   {['modern', 'classic', 'minimal'].map(t => (
                     <button key={t} onClick={() => updateExportConfig({ theme: t as any })} className={`p-3 text-xs font-bold rounded-xl border transition-all text-left flex items-center justify-between ${config.theme === t ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-200'}`}>
                        <span className="capitalize">{t} Theme</span>
                        {config.theme === t && <IconCheck className="w-4 h-4" />}
                     </button>
                   ))}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-600">Accent Color</span>
                   <input type="color" className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" value={config.primaryColor} onChange={e => updateExportConfig({ primaryColor: e.target.value })} />
                </div>
             </section>

             <section>
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Layout Settings</h3>
                <div className="space-y-2">
                   {[
                     { label: 'Cover Page', key: 'showCover' },
                     { label: 'Process Journey Map', key: 'showTOC' },
                     { label: 'Artifact Gallery', key: 'showAssets' }
                   ].map(opt => (
                     <label key={opt.key} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-colors">
                        <span className="text-xs font-bold text-slate-600">{opt.label}</span>
                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={(config as any)[opt.key]} onChange={e => updateExportConfig({ [opt.key]: e.target.checked })} />
                     </label>
                   ))}
                </div>
             </section>
          </div>

          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative bg-slate-100 flex items-center justify-center p-4">
             <div className="w-full h-full bg-white shadow-2xl rounded-2xl overflow-hidden">
                <iframe srcDoc={previewHtml} className="w-full h-full border-0" sandbox="allow-same-origin" />
             </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex-1 flex flex-col gap-4 md:gap-6 min-w-0 ${className}`} role="main">
      <div className="bg-white border-b md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-soft flex flex-col gap-3 md:gap-4 shrink-0">
        <div className="flex justify-between items-start">
          <div className="min-w-0 pr-4">
            <div className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Phase {currentStepIndex + 1} / 12</div>
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 truncate leading-tight">{currentStage.label.replace(/^\d+\.\s/, '')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${isPreviewMode ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
               <IconEye className="w-4 h-4" /> {isPreviewMode ? 'Editing Mode' : 'Preview Mode'}
            </button>
            <ProgressRing progress={progress} radius={window.innerWidth < 768 ? 20 : 24} className="text-blue-600 shrink-0" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 overflow-hidden">
             {isEditingTitle ? (
                 <input autoFocus type="text" className="text-xs font-bold text-slate-900 bg-blue-50 border-b-2 border-blue-500 outline-none flex-1 px-1 py-0.5 rounded" value={editTitleVal} onChange={e => setEditTitleVal(e.target.value)} onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()} />
               ) : (
                 <span className="text-xs font-bold text-slate-500 truncate cursor-pointer hover:text-blue-600 transition-colors" onClick={() => {setEditTitleVal(project.title); setIsEditingTitle(true);}}>{project.title}</span>
            )}
             <button onClick={() => setIsHistoryOpen(true)} className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md active:scale-95">
                <IconHistory className="w-3 h-3 mr-1 inline" /> History
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 md:gap-6 overflow-hidden px-4 md:px-0">
        {/* STRATEGY LAB (TEXT) */}
        <div className="flex flex-col min-h-0 flex-1">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-soft flex-1 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
               <div className="flex items-center gap-2">
                 <button onClick={() => setIsGuideOpen(true)} className="bg-blue-600 text-white rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    <IconLayout className="w-4 h-4 mr-1.5" /> Design Toolkit
                 </button>
               </div>
               <div className={`text-[10px] font-bold uppercase ${saveStatus === 'saved' ? 'text-emerald-500' : 'text-slate-300'}`}>
                   {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Cloud Saved' : 'Drafting'}
               </div>
            </div>
            
            <div className="flex-1 relative">
              {isPreviewMode ? (
                <div className="absolute inset-0 p-8 overflow-y-auto prose prose-slate prose-blue max-w-none bg-white">
                  <div className="text-slate-900" dangerouslySetInnerHTML={{ __html: parseMarkdown(notes) }} />
                  {notes.length === 0 && <p className="text-slate-300 italic">No notes to preview yet...</p>}
                </div>
              ) : (
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  onBlur={handleSave} 
                  placeholder={`Phase Instruction: ${currentStage.help}\n\nType your documentation here. Use Markdown for formatting (### Headers, **Bold**, - Lists)...`}
                  className="w-full h-full bg-white p-8 resize-none focus:outline-none text-slate-800 leading-relaxed text-base md:text-lg font-sans"
                />
              )}
            </div>
          </div>
        </div>

        {/* EVIDENCE VAULT (MEDIA) */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-soft flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
               <div className="flex items-center gap-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence Vault</h3>
               </div>
               <label className="cursor-pointer active:scale-95 transition-transform">
                  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                  <div className="px-5 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-blue-500/20 flex items-center">
                    <IconPlus className="w-4 h-4 mr-1.5" /> Add Evidence
                  </div>
               </label>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {stepAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center border-4 border-dashed border-slate-100 rounded-3xl text-slate-300 px-10">
                   <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                     <IconFile className="w-10 h-10 opacity-20" />
                   </div>
                   <h4 className="text-slate-400 font-bold mb-2">Proof of Work Needed</h4>
                   <p className="text-xs max-w-[240px]">Upload sketches, data maps, or wireframes to prove your process visually.</p>
                   <label className="mt-8 cursor-pointer bg-white border-2 border-slate-200 hover:border-blue-400 px-6 py-3 rounded-2xl text-slate-600 font-bold text-sm transition-all shadow-sm">
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                      Choose Artifact
                   </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {[...stepAssets].reverse().map((asset, i) => {
                    const originalIdx = project.assets.indexOf(asset);
                    return (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group animate-in zoom-in-95 duration-200">
                        <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-100">
                          <img src={asset.url || asset.dataURL} className="w-full h-full object-contain" alt={asset.name} />
                          <div className="absolute top-2 right-2 flex gap-1">
                             <button onClick={() => window.open(asset.url || asset.dataURL, '_blank')} className="p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-sm hover:bg-white transition-colors">
                               <IconEye className="w-4 h-4 text-slate-600" />
                             </button>
                             <button onClick={() => deleteAsset(originalIdx)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-sm hover:text-red-500 transition-colors">
                               <IconTrash className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{asset.name}</h5>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(asset.createdAt).toLocaleDateString()}</span>
                          </div>
                          <textarea 
                            placeholder="Explain the significance of this artifact... (e.g., 'Low-fidelity sketch exploring navigation patterns')" 
                            className="w-full text-xs p-3 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-xl outline-none transition-all resize-none h-20"
                            value={asset.caption || ''}
                            onChange={(e) => handleAssetCaptionChange(originalIdx, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="sticky bottom-0 md:static bg-white/95 md:bg-transparent backdrop-blur-xl p-4 md:p-0 border-t md:border-0 border-slate-200 flex justify-between items-center z-40 pb-safe">
         <Button variant="ghost" onClick={() => prevStep && onStepSelect(prevStep.id)} className={`px-4 ${!prevStep && 'invisible'}`}>Back</Button>
         <div className="flex gap-3">
            <button 
                onClick={toggleStepCompletion} 
                className={`p-3 rounded-full border transition-all active:scale-90 ${isStepComplete ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                title="Mark phase as finished"
            >
                <IconCheck className="w-6 h-6" />
            </button>
            <Button onClick={() => nextStep ? onStepSelect(nextStep.id) : onStepSelect('casestudy')} className="bg-blue-600 px-10 shadow-xl shadow-blue-500/20 rounded-full font-black tracking-wide">
                {nextStep ? 'Next Phase' : 'Finalize Portfolio'} <IconArrowRight className="w-4 h-4 ml-2" />
            </Button>
         </div>
      </div>

      <input type="file" ref={replaceInputRef} className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0] && replaceIndex !== null) onReplaceAsset(replaceIndex, e.target.files[0]); setReplaceIndex(null); }} />
      <ContextMenu isOpen={!!contextMenu} x={contextMenu?.x || 0} y={contextMenu?.y || 0} onClose={() => setContextMenu(null)} items={[
          { label: 'Replace Image', icon: <IconReplace className="w-4 h-4" />, onClick: () => contextMenu && (setReplaceIndex(contextMenu.assetIndex), replaceInputRef.current?.click()) },
          { label: 'Delete Asset', icon: <IconTrash className="w-4 h-4" />, danger: true, onClick: () => contextMenu && deleteAsset(contextMenu.assetIndex) }
      ]} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} versions={project.history || []} onRestore={restoreProjectVersion} />
      
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        onInsert={handleInsert} 
        currentStepId={currentStepId}
      />
    </main>
  );
};