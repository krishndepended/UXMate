import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Project, ProjectVersion, ExportConfig, CustomSection } from '../types';
import { STAGES, TEMPLATES, MACRO_PHASES } from '../constants';
import { Button } from './ui/Button';
import { 
  IconDownload, IconTrash, IconFile, IconReplace, IconCheck, IconArrowRight, 
  IconLayout, IconPlus, IconEye, IconEdit, IconChevronDown, IconClose, 
  IconSave, IconChecklist, IconBook, IconSplit, IconDocument, IconGrid,
  IconSparkles, IconQuote, IconTable, IconCode, IconZoomIn
} from './ui/Icons';
import { ProgressRing } from './ui/ProgressRing';
import { ContextMenu } from './ui/ContextMenu';
import { HistoryModal } from './HistoryModal';
import { GuideModal } from './GuideModal';
import { LightboxModal } from './LightboxModal';
import { generateFullHtml } from '../utils/exporter';
import { parseMarkdown } from '../utils/pdfTemplate';
import { STAGE_SCAFFOLDS } from '../utils/scaffolding';

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
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'gallery'>(() => {
    return (localStorage.getItem('uxmate_workspace_view') as 'split' | 'editor' | 'gallery') || 'split';
  });
  const [activeMobileTab, setActiveMobileTab] = useState<'strategy' | 'evidence'>('strategy');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'modified'>('idle');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(CELEBRATION_MESSAGES[0]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exportEditMode, setExportEditMode] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; assetIndex: number; } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const handleSetViewMode = (mode: 'split' | 'editor' | 'gallery') => {
    setViewMode(mode);
    localStorage.setItem('uxmate_workspace_view', mode);
  };

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

  const handleInsertStageScaffold = () => {
    const scaffold = STAGE_SCAFFOLDS[currentStepId] || `## 📋 ${currentStage.label}\n\n### Objective\n${currentStage.help}\n\n### Findings & Decisions\n- \n`;
    handleInsert(scaffold);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+B / Ctrl+B: Bold
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertMarkdownFormatting('**', '**');
    }
    // Cmd+I / Ctrl+I: Italic
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertMarkdownFormatting('*', '*');
    }
    // Cmd+K / Ctrl+K: Link
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      insertMarkdownFormatting('[', '](https://)');
    }
    // Tab key indent
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newNotes = notes.substring(0, start) + '  ' + notes.substring(end);
      setNotes(newNotes);
      notesRef.current = newNotes;
      setSaveStatus('modified');
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
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
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));
  const depthLevel = wordCount === 0 ? 'Empty' : wordCount < 50 ? 'Draft' : wordCount < 180 ? 'Detailed' : 'Comprehensive';

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
      <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-3.5 shadow-2xs flex flex-col gap-2.5 shrink-0 pt-safe">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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

          {/* Top Controls & View Mode Switcher */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Desktop View Mode Segmented Switcher */}
            <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button 
                onClick={() => handleSetViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'split' 
                    ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Side-by-side Strategy & Evidence"
              >
                <IconSplit className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button 
                onClick={() => handleSetViewMode('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'editor' 
                    ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Distraction-free Strategy Notes Focus"
              >
                <IconDocument className="w-3.5 h-3.5" />
                <span>Editor Focus</span>
              </button>
              <button 
                onClick={() => handleSetViewMode('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'gallery' 
                    ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Evidence Vault Visual Grid"
              >
                <IconGrid className="w-3.5 h-3.5" />
                <span>Gallery ({stepAssets.length})</span>
              </button>
            </div>

            {/* Stage Methodology Drawer Trigger */}
            <button 
              onClick={() => setIsGuideOpen(!isGuideOpen)} 
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                isGuideOpen 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Methodology Guidelines Drawer"
            >
              <IconBook className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stage Guide</span>
            </button>

            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)} 
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isPreviewMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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

      {/* Main Workspace Layout Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50/70">
        
        {/* VIEW MODE: GALLERY FOCUS */}
        {viewMode === 'gallery' ? (
          <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 overflow-hidden">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex-1 flex flex-col overflow-hidden">
              {/* Gallery Header Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Evidence Vault</h3>
                    <span className="text-xs text-slate-500">· {stepAssets.length} artifacts in this stage</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Wireframes, user test recordings, screen grabs, and research artifacts</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => handleSetViewMode('editor')} 
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    ← Edit Strategy Notes
                  </button>
                  <label className="cursor-pointer active:scale-95 transition-all">
                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                    <div className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center hover:bg-black">
                      <IconPlus className="w-3.5 h-3.5 mr-1.5" /> Add Evidence
                    </div>
                  </label>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
                {stepAssets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white m-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                      <IconGrid className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">No Evidence Attached</h4>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                      Upload design mockups, interview quotes, or user journey charts to support your strategy decisions.
                    </p>
                    <label className="cursor-pointer active:scale-95 transition-all">
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                      <span className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs">
                        + Select Image File
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {stepAssets.map((asset, i) => {
                      const originalIdx = project.assets.indexOf(asset);
                      return (
                        <div 
                          key={i} 
                          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
                        >
                          <div 
                            className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden"
                            onClick={() => setLightboxIndex(i)}
                          >
                            <img 
                              src={asset.url || asset.dataURL} 
                              alt={asset.name} 
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
                            />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-lg text-xs font-semibold text-slate-900 shadow-sm flex items-center gap-1.5 hover:bg-white active:scale-95 transition-all">
                                  <IconEye className="w-3.5 h-3.5" /> Lightbox
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement('a');
                                    link.href = asset.url || asset.dataURL || '';
                                    link.download = asset.name || 'artifact.png';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-sm text-slate-700 hover:text-slate-950 hover:bg-white active:scale-95 transition-all"
                                  title="Download Original Asset"
                                >
                                  <IconDownload className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplaceIndex(originalIdx);
                                    replaceInputRef.current?.click();
                                  }}
                                  className="p-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-sm text-slate-700 hover:text-slate-950 hover:bg-white active:scale-95 transition-all"
                                  title="Replace Image"
                                >
                                  <IconReplace className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAsset(originalIdx);
                                  }}
                                  className="p-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-sm text-red-600 hover:bg-red-50 active:scale-95 transition-all"
                                  title="Remove Artifact"
                                >
                                  <IconTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h5 className="text-xs font-bold text-slate-900 truncate" title={asset.name}>
                                  {asset.name}
                                </h5>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {new Date(asset.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <textarea 
                                placeholder="Explain rationale or findings..." 
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400 transition-colors resize-none h-14 text-slate-700 leading-relaxed font-sans placeholder:text-slate-400"
                                value={asset.caption || ''}
                                onChange={(e) => handleAssetCaptionChange(originalIdx, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE: SPLIT OR EDITOR FOCUS */
          <div className={`flex-1 flex flex-col ${viewMode === 'editor' ? 'overflow-y-auto p-4 md:p-6' : 'md:grid md:grid-cols-2 gap-0 md:gap-5 overflow-hidden p-0 md:p-5'}`}>
            
            {/* Strategy Editor Pane */}
            <div className={`flex flex-col min-h-0 flex-1 h-full bg-white md:bg-transparent transition-all ${
              viewMode === 'editor' ? 'max-w-4xl mx-auto w-full' : ''
            } ${
              activeMobileTab === 'strategy' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 absolute md:relative opacity-0 md:opacity-100'
            }`}>
              <div className="bg-white md:border md:border-slate-200 md:rounded-2xl shadow-xs flex-1 flex flex-col relative overflow-hidden">
                
                {/* Formatting & Frameworks Toolbar */}
                <div className="flex flex-col border-b border-slate-100 bg-slate-50/70 shrink-0">
                  <div className="flex items-center justify-between px-3.5 py-2 gap-2 flex-wrap">
                    {/* Markdown Quick Formatting */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button 
                          onClick={() => insertMarkdownFormatting('**', '**')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                          title="Bold (⌘B)"
                        >
                          B
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('*', '*')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs italic font-serif transition-colors"
                          title="Italic (⌘I)"
                        >
                          I
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('## ')} 
                          className="px-1.5 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                          title="Heading 2"
                        >
                          H2
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('### ')} 
                          className="px-1.5 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                          title="Heading 3"
                        >
                          H3
                        </button>
                      </div>

                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button 
                          onClick={() => insertMarkdownFormatting('- ')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs transition-colors"
                          title="Bullet List"
                        >
                          • List
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('1. ')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs transition-colors"
                          title="Numbered List"
                        >
                          1. List
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('- [ ] ')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
                          title="Task Checklist"
                        >
                          <IconChecklist className="w-3.5 h-3.5" /> Task
                        </button>
                      </div>

                      <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button 
                          onClick={() => insertMarkdownFormatting('> "Quote" — User Role\n')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
                          title="Insert User Quote"
                        >
                          <IconQuote className="w-3.5 h-3.5" /> Quote
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('> 💡 **Key Finding:** ')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
                          title="Insert Key Finding Callout"
                        >
                          <span>💡</span> Finding
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('> 🧪 **Hypothesis:** Because [insight], we expect [outcome].\n')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
                          title="Insert Hypothesis"
                        >
                          <span>🧪</span> Hypothesis
                        </button>
                        <button 
                          onClick={() => insertMarkdownFormatting('\n| Feature / Finding | Rationale | Priority |\n|---|---|---|\n| Item 1 | Detail description | High |\n')} 
                          className="px-2 py-1 rounded text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
                          title="Insert Markdown Table"
                        >
                          <IconTable className="w-3.5 h-3.5" /> Table
                        </button>
                      </div>
                    </div>

                    {/* Right Action & Telemetry */}
                    <div className="flex items-center gap-2.5">
                      {viewMode === 'editor' && (
                        <button 
                          onClick={() => handleSetViewMode('gallery')}
                          className="text-xs text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1 mr-1"
                        >
                          <IconGrid className="w-3.5 h-3.5" />
                          <span>{stepAssets.length} Artifacts →</span>
                        </button>
                      )}

                      {/* Word count & Reading Telemetry */}
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <span>{wordCount} words</span>
                        <span>·</span>
                        <span>~{readTimeMinutes}m read</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold uppercase ${
                          depthLevel === 'Comprehensive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          depthLevel === 'Detailed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {depthLevel}
                        </span>
                      </div>

                      <button 
                        onClick={handleSave} 
                        className={`text-[11px] font-semibold uppercase px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          saveStatus === 'saved' ? 'text-emerald-700 bg-emerald-50' : 
                          saveStatus === 'saving' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs'
                        }`}
                        title="Save Notes (⌘S)"
                      >
                        <IconSave className="w-3 h-3" />
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Stage-Specific Guided Scaffolding Banner if Notes are Empty */}
                  {notes.trim().length === 0 && !isPreviewMode && (
                    <div className="mx-4 mb-2 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <IconSparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-blue-950 truncate">
                            Start with the {currentStage.label.replace(/^\d+\.\s/, '')} framework
                          </div>
                          <div className="text-[11px] text-blue-800/80 mt-0.5 truncate">
                            Pre-structured sections for user pain points, key metrics, and evidence
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleInsertStageScaffold} 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 shadow-2xs"
                      >
                        Insert Framework
                      </Button>
                    </div>
                  )}

                  {/* Template shortcuts */}
                  {phaseTemplates.length > 0 && !isPreviewMode && (
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
                       {phaseTemplates.map(t => (
                         <button 
                           key={t.key} 
                           onClick={() => handleInsert(t.content)} 
                           className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap shadow-2xs active:scale-95"
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
                      onKeyDown={handleTextareaKeyDown}
                      onBlur={handleSave} 
                      placeholder={`Stage Guide: ${currentStage.help}\n\nDocument your design rationale, user findings, problem statements, and specifications here...\n\n(Tip: Paste images directly with Cmd+V or drag & drop files onto this window)`}
                      className="w-full h-full bg-white p-6 md:p-8 resize-none focus:outline-none text-slate-800 leading-relaxed text-sm md:text-base font-normal font-sans placeholder:text-slate-400"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Artifacts & Evidence Vault Pane (Visible in Split Mode) */}
            {viewMode === 'split' && (
              <div className={`flex flex-col flex-1 min-h-0 h-full bg-slate-50 md:bg-transparent transition-all ${
                activeMobileTab === 'evidence' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 absolute md:relative opacity-0 md:opacity-100'
              }`}>
                <div className="bg-white md:border md:border-slate-200 md:rounded-2xl shadow-xs flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
                     <div>
                       <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Process Artifacts</h3>
                       <p className="text-[11px] text-slate-400">Sketches, Wireframes, Screen Captures ({stepAssets.length})</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleSetViewMode('gallery')}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 text-xs font-medium"
                          title="Expand to Full Gallery"
                        >
                          <IconGrid className="w-4 h-4" />
                        </button>
                        <label className="cursor-pointer active:scale-95 transition-all">
                          <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                          <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium shadow-2xs flex items-center hover:bg-black">
                            <IconPlus className="w-3.5 h-3.5 mr-1" /> Add Evidence
                          </div>
                        </label>
                     </div>
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
                        {stepAssets.map((asset, i) => {
                          const originalIdx = project.assets.indexOf(asset);
                          return (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs group">
                              <div 
                                className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden mb-2.5 border border-slate-100 cursor-pointer"
                                onClick={() => setLightboxIndex(i)}
                              >
                                <img src={asset.url || asset.dataURL} className="w-full h-full object-contain" alt={asset.name} />
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setLightboxIndex(i);
                                     }} 
                                     className="p-1.5 bg-white/95 backdrop-blur-md rounded-md shadow text-slate-800 hover:text-black active:scale-95 transition-all"
                                     title="View in Lightbox"
                                   >
                                     <IconEye className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const link = document.createElement('a');
                                       link.href = asset.url || asset.dataURL || '';
                                       link.download = asset.name || 'artifact.png';
                                       document.body.appendChild(link);
                                       link.click();
                                       document.body.removeChild(link);
                                     }}
                                     className="p-1.5 bg-white/95 backdrop-blur-md rounded-md shadow text-slate-700 hover:text-black active:scale-95 transition-all"
                                     title="Download Original"
                                   >
                                     <IconDownload className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setReplaceIndex(originalIdx);
                                       replaceInputRef.current?.click();
                                     }} 
                                     className="p-1.5 bg-white/95 backdrop-blur-md rounded-md shadow text-slate-700 hover:text-black active:scale-95 transition-all"
                                     title="Replace Image"
                                   >
                                     <IconReplace className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       deleteAsset(originalIdx);
                                     }} 
                                     className="p-1.5 bg-white/95 backdrop-blur-md rounded-md shadow text-red-600 hover:bg-red-50 active:scale-95 transition-all"
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
            )}
          </div>
        )}
      </div>

      {/* Sticky Primary Action Command Footer */}
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

            {/* Dominant Primary Next CTA */}
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
      
      {/* Dockable Slide-out Methodology Drawer */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onInsert={handleInsert} currentStepId={currentStepId} />

      {/* Full fidelity In-App Image Lightbox */}
      <LightboxModal 
        isOpen={lightboxIndex !== null}
        assets={stepAssets}
        currentIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        onDeleteAsset={(idx) => {
          const targetAsset = stepAssets[idx];
          if (targetAsset) {
            const origIdx = project.assets.indexOf(targetAsset);
            if (origIdx >= 0) deleteAsset(origIdx);
          }
        }}
        onUpdateCaption={(idx, caption) => {
          const targetAsset = stepAssets[idx];
          if (targetAsset) {
            const origIdx = project.assets.indexOf(targetAsset);
            if (origIdx >= 0) handleAssetCaptionChange(origIdx, caption);
          }
        }}
      />
    </main>
  );
};
