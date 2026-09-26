import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Project, ProjectVersion, ExportConfig, CustomSection } from '../types';
import { STAGES, TEMPLATES, MACRO_PHASES } from '../constants';
import { Button } from './ui/Button';
import { 
  IconDownload, IconTrash, IconFile, IconReplace, IconCheck, IconArrowRight, 
  IconLayout, IconPlus, IconEye, IconEdit, IconChevronDown, IconClose, 
  IconSave, IconChecklist, IconBook 
} from './ui/Icons';
import { ProgressRing } from './ui/ProgressRing';
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

const CELEBRATION_MESSAGES = [
  { title: "Milestone Verified!", subtitle: "Great progress on your product design roadmap.", icon: "🎯" },
  { title: "Research Validated!", subtitle: "User insights synthesized into clear design direction.", icon: "🔍" },
  { title: "Architecture Defined!", subtitle: "Information structure and flows mapped cleanly.", icon: "📐" },
  { title: "Interface Validated!", subtitle: "Visual hierarchy and interaction specifications set.", icon: "✨" },
  { title: "Usability Tested!", subtitle: "User feedback captured and prioritized for iteration.", icon: "🧪" },
  { title: "Portfolio Ready!", subtitle: "Case study ready for executive review.", icon: "🏆" }
];

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
  const [activeMobileTab, setActiveMobileTab] = useState<'strategy' | 'evidence'>('strategy');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'modified'>('idle');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(CELEBRATION_MESSAGES[0]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exportEditMode, setExportEditMode] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; assetIndex: number; } | null>(null);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const notesRef = useRef(notes);

  const currentStage = STAGES.find(s => s.id === currentStepId) || STAGES[0];
  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const nextStep = STAGES[currentStepIndex + 1];
  const prevStep = STAGES[currentStepIndex - 1];

  const currentMacroPhase = useMemo(() => {
    return MACRO_PHASES.find(p => p.stageIds.includes(currentStepId)) || MACRO_PHASES[0];
  }, [currentStepId]);

  const phaseTemplates = TEMPLATES.filter(t => t.category === currentStage.templateCategory || t.key === currentStage.id);

  // Sync external project state with local notes
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
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 250);
  }, [project, currentStepId, updateStepData]);

  // Debounced auto-save
  useEffect(() => {
    const intervalId = setInterval(() => { if (saveStatus === 'modified') handleSave(); }, 3500);
    return () => clearInterval(intervalId);
  }, [handleSave, saveStatus]);

  // Keyboard shortcut listener: Cmd+S to save, Cmd+Enter to complete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        toggleStepCompletion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Clipboard paste listener: paste images directly
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            onUploadAsset(file);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onUploadAsset]);

  // Drag and drop handler for image artifacts
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/')) {
          onUploadAsset(file);
        }
      }
    }
  };

  const toggleStepCompletion = () => {
    if (!project || !project.steps) return;
    const isCurrentlyComplete = project.steps[currentStepId]?.isComplete || false;
    const nextCompleteState = !isCurrentlyComplete;
    if (nextCompleteState) {
      const randomMsg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebrationData(randomMsg);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2800);
    }
    updateStepData(currentStepId, { notes, isComplete: nextCompleteState });
  };

  const handleInsert = (content: string) => {
    const newNotes = notes.trim() ? notes + "\n\n" + content : content;
    setNotes(newNotes);
    notesRef.current = newNotes;
    setSaveStatus('modified');
    handleSave();
  };

  // Markdown formatting helper
  const insertMarkdownFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newNotes = notes.substring(0, start) + replacement + notes.substring(end);
    setNotes(newNotes);
    notesRef.current = newNotes;
    setSaveStatus('modified');
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  const updateExportConfig = (updates: Partial<ExportConfig>) => {
    if (!project) return;
    const current = project.exportConfig || {
      theme: 'modern',
      primaryColor: '#2563EB',
      fontFamily: 'Inter',
      showCover: true,
      showTOC: true,
      showAssets: true,
      designerName: '',
      designerRole: 'Product Designer',
      excludedSteps: [],
      sectionOrder: STAGES.filter(s => s.id !== 'casestudy').map(s => s.id),
      customSections: []
    };
    updateProject(project.id, { exportConfig: { ...current, ...updates } });
  };

  const toggleSectionExcluded = (id: string) => {
    if (!project) return;
    const current = project.exportConfig?.excludedSteps || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    updateExportConfig({ excludedSteps: next });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    if (!project) return;
    const order = project.exportConfig?.sectionOrder || STAGES.filter(s => s.id !== 'casestudy').map(s => s.id);
    const index = order.indexOf(id);
    if (index === -1) return;
    const newOrder = [...order];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    updateExportConfig({ sectionOrder: newOrder });
  };

  const addCustomSection = () => {
    if (!project) return;
    const id = 'custom_' + Date.now();
    const newSection: CustomSection = { id, title: 'New Custom Section', content: '', showAssets: false };
    const currentSections = project.exportConfig?.customSections || [];
    const currentOrder = project.exportConfig?.sectionOrder || STAGES.filter(s => s.id !== 'casestudy').map(s => s.id);
    updateExportConfig({ 
      customSections: [...currentSections, newSection],
      sectionOrder: [...currentOrder, id]
    });
  };

  const handleAssetCaptionChange = (index: number, caption: string) => {
    if (!project) return;
    const updatedAssets = [...project.assets];
    updatedAssets[index] = { ...updatedAssets[index], caption };
    updateProject(project.id, { assets: updatedAssets });
  };

  if (!project) return null;

  const isStepComplete = project.steps?.[currentStepId]?.isComplete;
  const progress = project.steps ? Math.round((STAGES.filter(s => project.steps?.[s.id]?.isComplete).length / STAGES.length) * 100) : 0;
  const stepAssets = project.assets ? project.assets.filter(a => (a.stepId === currentStepId) || (currentStepId === 'problem' && !a.stepId)) : [];
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  // CASE STUDY / EXPORT STUDIO VIEW
  if (currentStepId === 'casestudy') {
    const config = project.exportConfig || { 
      theme: 'modern', 
      primaryColor: '#2563EB', 
      fontFamily: 'Inter', 
      showCover: true, 
      showTOC: true, 
      showAssets: true, 
      designerName: '', 
      designerRole: 'Product Designer', 
      excludedSteps: [], 
      sectionOrder: STAGES.filter(s => s.id !== 'casestudy').map(s => s.id), 
      customSections: [] 
    };
    const order = config.sectionOrder || STAGES.filter(s => s.id !== 'casestudy').map(s => s.id);

    return (
      <main className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-safe ${className}`}>
        {/* Export Studio Header */}
        <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onStepSelect(STAGES[STAGES.length - 2].id)} 
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
              title="Return to Iteration Phase"
            >
              <IconArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Final Deliverable</span>
                <span>·</span>
                <span>Step 12 of 12</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Case Study Export Studio</h1>
            </div>
          </div>
          <div className="flex gap-2.5 w-full md:w-auto">
            <Button onClick={() => setExportEditMode(!exportEditMode)} variant="outline" className="flex-1 md:flex-none text-xs font-semibold">
              {exportEditMode ? <><IconEye className="w-4 h-4 mr-1.5" /> Preview</> : <><IconEdit className="w-4 h-4 mr-1.5" /> Edit Sections</>}
            </Button>
            <Button onClick={() => onExport(project)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm">
              <IconDownload className="w-4 h-4 mr-1.5" /> Export Portfolio Case Study
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-6 overflow-hidden p-0 lg:p-6 bg-slate-50/50">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-white lg:border lg:border-slate-200 lg:rounded-2xl p-5 md:p-6 shadow-xs flex flex-col gap-6 overflow-y-auto max-h-[35vh] lg:max-h-full">
             <section>
                <div className="flex items-center justify-between mb-3">
                   <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Layout Sections ({order.length})</h3>
                   <button onClick={addCustomSection} className="text-xs font-semibold text-blue-600 hover:underline">+ Add Section</button>
                </div>
                <div className="space-y-1.5">
                   {order.map((oid) => {
                     const stage = STAGES.find(s => s.id === oid);
                     const custom = config.customSections?.find(cs => cs.id === oid);
                     const isExcluded = config.excludedSteps.includes(oid);
                     if (!stage && !custom) return null;
                     return (
                       <div key={oid} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isExcluded ? 'bg-slate-50 text-slate-400 border-slate-100 opacity-60' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                             <div className="flex flex-col gap-0.5 shrink-0">
                                <button onClick={() => moveSection(oid, 'up')} className="p-0.5 hover:text-blue-600"><IconChevronDown className="w-3 h-3 rotate-180" /></button>
                                <button onClick={() => moveSection(oid, 'down')} className="p-0.5 hover:text-blue-600"><IconChevronDown className="w-3 h-3" /></button>
                             </div>
                             <span className="text-sm shrink-0">{stage?.icon || '📄'}</span>
                             <span className="text-xs font-medium truncate">{stage?.label.split('. ')[1] || custom?.title}</span>
                          </div>
                          <button onClick={() => toggleSectionExcluded(oid)} className={`p-1 rounded-md transition-colors ${isExcluded ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>
                              {isExcluded ? <IconPlus className="w-3.5 h-3.5" /> : <IconClose className="w-3.5 h-3.5" />}
                          </button>
                       </div>
                     );
                   })}
                </div>
             </section>

             <section>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Branding & Typography</h3>
                <div className="space-y-3.5">
                   <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accent Color</label>
                      <div className="flex gap-2.5 items-center">
                         <input type="color" className="w-9 h-9 rounded-lg cursor-pointer bg-white border border-slate-200" value={config.primaryColor} onChange={e => updateExportConfig({ primaryColor: e.target.value })} />
                         <input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-700 uppercase" value={config.primaryColor} onChange={e => updateExportConfig({ primaryColor: e.target.value })} />
                      </div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Typography Family</label>
                      <select 
                        className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                        value={config.fontFamily} 
                        onChange={e => updateExportConfig({ fontFamily: e.target.value as any })}
                      >
                         <option value="Inter">Modern Sans (Clean & Tech-Forward)</option>
                         <option value="Serif">Classic Editorial (High-Contrast Serif)</option>
                         <option value="Mono">Engineering Monospace (Data & Precision)</option>
                      </select>
                   </div>
                </div>
             </section>
          </div>

          {/* Builder Canvas Area */}
          <div className="lg:col-span-8 bg-slate-100 flex-1 flex flex-col p-4 lg:p-0 overflow-hidden relative">
             <div className="w-full h-full bg-white shadow-sm lg:rounded-2xl overflow-hidden border border-slate-200 flex flex-col relative">
                {exportEditMode ? (
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white flex flex-col gap-8 max-w-3xl mx-auto w-full">
                    {/* WYSIWYG COVER */}
                    <div className="border-l-4 pl-6 py-6 flex flex-col gap-4" style={{ borderColor: config.primaryColor }}>
                       <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.primaryColor }}>Product UX Case Study</span>
                       <input 
                         className="text-2xl md:text-3xl font-bold text-slate-900 border-none outline-none p-0 bg-transparent w-full"
                         value={project.title}
                         onChange={(e) => updateProject(project.id, { title: e.target.value })}
                       />
                       <textarea 
                         className="text-sm text-slate-600 border-none outline-none p-0 bg-transparent w-full resize-none"
                         rows={2}
                         value={project.desc}
                         onChange={(e) => updateProject(project.id, { desc: e.target.value })}
                       />
                       <div className="flex gap-4 mt-2">
                         <input 
                            className="text-sm font-semibold text-slate-900 border-none outline-none p-0 bg-transparent w-1/2"
                            value={config.designerName}
                            placeholder="Your Name"
                            onChange={(e) => updateExportConfig({ designerName: e.target.value })}
                         />
                         <input 
                            className="text-xs font-medium border-none outline-none p-0 bg-transparent w-1/2"
                            style={{ color: config.primaryColor }}
                            value={config.designerRole}
                            placeholder="Your Professional Role"
                            onChange={(e) => updateExportConfig({ designerRole: e.target.value })}
                         />
                       </div>
                    </div>

                    {/* WYSIWYG SECTIONS */}
                    {order.map((oid) => {
                       const stage = STAGES.find(s => s.id === oid);
                       const custom = config.customSections?.find(cs => cs.id === oid);
                       if (config.excludedSteps.includes(oid)) return null;
                       const content = custom ? custom.content : (config.customOverrides?.[oid] || project.steps[oid]?.notes || (oid === 'problem' ? project.notes : ''));
                       
                       return (
                         <div key={oid} className="flex flex-col gap-3 p-5 rounded-xl bg-slate-50/70 border border-slate-200">
                            <div className="flex items-center gap-3">
                               <span className="text-lg">{stage?.icon || '📄'}</span>
                               <span className="text-sm font-bold text-slate-900">{stage?.label || custom?.title}</span>
                            </div>
                            <textarea 
                              className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg outline-none font-sans leading-relaxed focus:border-blue-400 transition-colors"
                              rows={5}
                              value={content}
                              onChange={(e) => {
                                if (custom) {
                                  const updatedSections = (config.customSections || []).map(s => s.id === oid ? { ...s, content: e.target.value } : s);
                                  updateExportConfig({ customSections: updatedSections });
                                } else {
                                  const currentOverrides = config.customOverrides || {};
                                  updateExportConfig({ customOverrides: { ...currentOverrides, [oid]: e.target.value } });
                                }
                              }}
                            />
                         </div>
                       );
                    })}
                  </div>
                ) : (
                  <iframe 
                    title="Case Study Preview"
                    srcDoc={generateFullHtml(project, true)}
                    className="w-full h-full border-none bg-white"
                  />
                )}
             </div>
          </div>
        </div>
      </main>
    );
  }

  // STANDARD WORKSPACE (STEPS 1 - 11)
  return (
    <main 
      className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-safe relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Over Highlight Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 border-4 border-dashed border-blue-500 rounded-2xl flex items-center justify-center pointer-events-none backdrop-blur-2xs">
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-blue-200 text-center">
            <span className="text-3xl mb-2 block">📥</span>
            <p className="text-sm font-bold text-slate-900">Drop images anywhere</p>
            <p className="text-xs text-slate-500 mt-0.5">Attach screenshots, wireframes, or test evidence to this step</p>
          </div>
        </div>
      )}

      {/* Milestone Verified Feedback */}
      {showCelebration && (
        <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center animate-in zoom-in-95 duration-200">
           <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4">
              <span className="text-5xl mb-3">{celebrationData.icon}</span>
              <h3 className="text-lg font-bold text-slate-900">{celebrationData.title}</h3>
              <p className="text-slate-600 text-xs mt-1">{celebrationData.subtitle}</p>
              <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ✓ {progress}% of project roadmap complete
              </div>
           </div>
        </div>
      )}

      {/* Main Workspace Header */}
      <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-3.5 shadow-2xs flex flex-col gap-2 shrink-0 pt-safe">
        <div className="flex justify-between items-start md:items-center gap-4">
          <div className="min-w-0 flex-1">
            {/* Breadcrumb Hierarchy */}
            <div className="flex flex-wrap items-center gap-2 mb-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-800 truncate max-w-[150px]">{project.title}</span>
              <span>/</span>
              <span className="text-blue-600 font-medium">{currentMacroPhase.shortName}</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">Step {currentStepIndex + 1} of 12</span>
              {isStepComplete && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <IconCheck className="w-3 h-3 text-emerald-600 stroke-[3]" /> Completed
                  </span>
                </>
              )}
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {currentStage.label.replace(/^\d+\.\s/, '')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{currentStage.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)} 
              className={`p-2 rounded-lg border transition-all active:scale-95 ${
                isPreviewMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={isPreviewMode ? 'Switch to Edit' : 'Preview Formatted Markdown'}
            >
              <IconEye className="w-4 h-4" />
            </button>

            <div className="scale-75 md:scale-90 origin-right">
              <ProgressRing progress={progress} radius={24} stroke={3.5} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveMobileTab('strategy')} 
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMobileTab === 'strategy' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <IconFile className="w-3.5 h-3.5" /> Strategy Notes
          </button>
          <button 
            onClick={() => setActiveMobileTab('evidence')} 
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMobileTab === 'evidence' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <IconLayout className="w-3.5 h-3.5" /> Evidence ({stepAssets.length})
          </button>
        </div>
      </div>

      {/* Main Content Grid (Strategy Pane + Artifacts Vault) */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-0 md:gap-5 overflow-hidden p-0 md:p-5 bg-slate-50/40">
        
        {/* Strategy Editor Pane */}
        <div className={`flex flex-col min-h-0 flex-1 h-full bg-white md:bg-transparent transition-all ${
          activeMobileTab === 'strategy' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 absolute md:relative opacity-0 md:opacity-100'
        }`}>
          <div className="bg-white md:border md:border-slate-200 md:rounded-2xl shadow-xs flex-1 flex flex-col relative overflow-hidden">
            
            {/* Formatting & Frameworks Toolbar */}
            <div className="flex flex-col border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center justify-between px-4 py-2.5 gap-2 flex-wrap">
                {/* Markdown Quick Formatting */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => insertMarkdownFormatting('**', '**')} 
                    className="p-1 rounded-md text-slate-600 hover:bg-slate-200 text-xs font-bold px-2"
                    title="Bold"
                  >
                    B
                  </button>
                  <button 
                    onClick={() => insertMarkdownFormatting('### ')} 
                    className="p-1 rounded-md text-slate-600 hover:bg-slate-200 text-xs font-bold px-1.5"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button 
                    onClick={() => insertMarkdownFormatting('- ')} 
                    className="p-1 rounded-md text-slate-600 hover:bg-slate-200 text-xs px-1.5"
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button 
                    onClick={() => insertMarkdownFormatting('- [ ] ')} 
                    className="p-1 rounded-md text-slate-600 hover:bg-slate-200 text-xs px-1.5 flex items-center gap-1"
                    title="Checklist Task"
                  >
                    <IconChecklist className="w-3.5 h-3.5" /> Task
                  </button>
                  <button 
                    onClick={() => insertMarkdownFormatting('> ')} 
                    className="p-1 rounded-md text-slate-600 hover:bg-slate-200 text-xs italic px-1.5"
                    title="Quote"
                  >
                    "Quote"
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsGuideOpen(true)} 
                    className="bg-slate-900 hover:bg-black text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center shadow-2xs active:scale-95 transition-all"
                  >
                    <IconBook className="w-3.5 h-3.5 mr-1.5" /> Stage Guide
                  </button>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-400">{wordCount} words</span>
                    <button 
                      onClick={handleSave} 
                      className={`text-[11px] font-semibold uppercase px-2 py-1 rounded transition-all flex items-center gap-1 ${
                        saveStatus === 'saved' ? 'text-emerald-700 bg-emerald-50' : 
                        saveStatus === 'saving' ? 'text-blue-700 bg-blue-50' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <IconSave className="w-3 h-3" />
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Template shortcuts */}
              {phaseTemplates.length > 0 && !isPreviewMode && (
                <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto hide-scrollbar">
                   {phaseTemplates.map(t => (
                     <button 
                       key={t.key} 
                       onClick={() => handleInsert(t.content)} 
                       className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap shadow-2xs active:scale-95"
                     >
                       + {t.label}
                     </button>
                   ))}
                </div>
              )}
            </div>
            
            {/* Editor Textarea or Markdown Preview */}
            <div className="flex-1 relative overflow-hidden">
              {isPreviewMode ? (
                <div className="absolute inset-0 p-6 md:p-8 overflow-y-auto prose prose-slate max-w-none bg-white font-sans">
                  <div className="text-slate-800 leading-relaxed text-sm md:text-base font-normal" dangerouslySetInnerHTML={{ __html: parseMarkdown(notes) }} />
                  {notes.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic py-20">
                      <IconFile className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-xs">No strategy notes drafted yet. Click Edit to begin.</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={notes}
                  onChange={handleNotesChange}
                  onBlur={handleSave} 
                  placeholder={`Stage Guide: ${currentStage.help}\n\nDocument your design rationale, user findings, problem statements, and specifications here...\n\n(Tip: Paste images directly with Cmd+V or drag & drop files onto this window)`}
                  className="w-full h-full bg-white p-6 md:p-8 resize-none focus:outline-none text-slate-800 leading-relaxed text-sm md:text-base font-normal font-sans placeholder:text-slate-400"
                />
              )}
            </div>
          </div>
        </div>

        {/* Artifacts & Evidence Vault Pane */}
        <div className={`flex flex-col flex-1 min-h-0 h-full bg-slate-50 md:bg-transparent transition-all ${
          activeMobileTab === 'evidence' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 absolute md:relative opacity-0 md:opacity-100'
        }`}>
          <div className="bg-white md:border md:border-slate-200 md:rounded-2xl shadow-xs flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
               <div>
                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Process Artifacts</h3>
                 <p className="text-[11px] text-slate-400">Sketches, Wireframes, Screen Captures ({stepAssets.length})</p>
               </div>
               <label className="cursor-pointer active:scale-95 transition-all">
                  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                  <div className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium shadow-2xs flex items-center hover:bg-black">
                    <IconPlus className="w-3.5 h-3.5 mr-1" /> Add Evidence
                  </div>
               </label>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30">
              {stepAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl m-1">
                   <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mb-3">
                     <IconFile className="w-6 h-6 text-slate-300" />
                   </div>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">No Evidence Attached</h4>
                   <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                     Paste screenshots from clipboard (Cmd+V) or drop design files here to back up your design decisions.
                   </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...stepAssets].reverse().map((asset, i) => {
                    const originalIdx = project.assets.indexOf(asset);
                    return (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs group">
                        <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden mb-2.5 border border-slate-100">
                          <img src={asset.url || asset.dataURL} className="w-full h-full object-contain" alt={asset.name} />
                          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                             <button 
                               onClick={() => {
                                 const w = window.open('', '_blank');
                                 if (w) {
                                   w.document.write(`<img src="${asset.url || asset.dataURL}" style="max-width:100%;height:auto;margin:auto;display:block;" />`);
                                 }
                               }} 
                               className="p-1.5 bg-white/95 backdrop-blur-md rounded-md shadow text-slate-800 active:scale-95"
                               title="View Fullscreen"
                             >
                               <IconEye className="w-3.5 h-3.5" />
                             </button>
                             <button 
                               onClick={() => deleteAsset(originalIdx)} 
                               className="p-1.5 bg-white/95 backdrop-blur-md rounded-md shadow text-red-600 active:scale-95"
                               title="Remove Artifact"
                             >
                               <IconTrash className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <h5 className="text-xs font-semibold text-slate-800 truncate pr-2">{asset.name}</h5>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(asset.createdAt).toLocaleDateString()}</span>
                          </div>
                          <textarea 
                            placeholder="Add strategic context explaining this artifact..." 
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400 transition-colors resize-none h-16 text-slate-700 leading-relaxed font-sans placeholder:text-slate-400"
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

      {/* Sticky Primary Action Command Footer (Fitts's Law: Generous target, natural reach) */}
      <div className="hidden md:flex bg-white px-6 py-3 justify-between items-center z-40 pb-safe shadow-xs border-t border-slate-200">
         <button 
           onClick={() => prevStep && onStepSelect(prevStep.id)} 
           className={`flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 active:scale-95 transition-all p-2 rounded-lg hover:bg-slate-100 ${
             !prevStep && 'invisible opacity-0'
           }`}
         >
           <IconArrowRight className="w-4 h-4 rotate-180" /> 
           <span>Previous: {prevStep?.label.split('. ')[1]}</span>
         </button>
         
         <div className="flex gap-3 items-center">
            {/* Mark Complete Toggle */}
            <button 
                onClick={toggleStepCompletion} 
                className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 border ${
                  isStepComplete 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
                title="Mark this milestone verified"
            >
                <IconCheck className={`w-3.5 h-3.5 ${isStepComplete ? 'stroke-[3]' : ''}`} />
                <span className="text-xs font-semibold">
                  {isStepComplete ? 'Completed' : 'Mark Complete'}
                </span>
            </button>

            {/* Dominant Primary Next CTA (Von Restorff Effect) */}
            <Button 
              onClick={() => nextStep ? onStepSelect(nextStep.id) : onStepSelect('casestudy')} 
              size="lg" 
              className="bg-slate-900 hover:bg-black text-white h-10 px-6 rounded-xl shadow-sm text-xs font-semibold"
            >
              {nextStep ? `Next: ${nextStep.label.split('. ')[1]}` : 'Compile Case Study'} 
              <IconArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
         </div>
      </div>

      <input type="file" ref={replaceInputRef} className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0] && replaceIndex !== null) onReplaceAsset(replaceIndex, e.target.files[0]); setReplaceIndex(null); }} />
      
      <ContextMenu isOpen={!!contextMenu} x={contextMenu?.x || 0} y={contextMenu?.y || 0} onClose={() => setContextMenu(null)} items={[
          { label: 'Replace Image', icon: <IconReplace className="w-4 h-4" />, onClick: () => contextMenu && (setReplaceIndex(contextMenu.assetIndex), replaceInputRef.current?.click()) },
          { label: 'Delete Asset', icon: <IconTrash className="w-4 h-4" />, danger: true, onClick: () => contextMenu && deleteAsset(contextMenu.assetIndex) }
      ]} />
      
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} versions={project.history || []} onRestore={restoreProjectVersion} />
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onInsert={handleInsert} currentStepId={currentStepId} />
    </main>
  );
};
