import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectVersion, ExportConfig, Asset, CustomSection } from '../types';
import { STAGES, TEMPLATES } from '../constants';
import { Button } from './ui/Button';
import { IconDownload, IconTrash, IconFile, IconReplace, IconCheck, IconArrowRight, IconLayout, IconPlus, IconEye, IconEdit, IconChevronDown, IconClose } from './ui/Icons';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exportEditMode, setExportEditMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; assetIndex: number; } | null>(null);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const notesRef = useRef(notes);

  const currentStage = STAGES.find(s => s.id === currentStepId) || STAGES[0];
  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const nextStep = STAGES[currentStepIndex + 1];
  const prevStep = STAGES[currentStepIndex - 1];

  const phaseTemplates = TEMPLATES.filter(t => t.category === currentStage.templateCategory || t.key === currentStage.id);

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
    const isCurrentlyComplete = project.steps[currentStepId]?.isComplete || false;
    const nextCompleteState = !isCurrentlyComplete;
    if (nextCompleteState) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
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

  const updateOverride = (id: string, content: string) => {
    if (!project) return;
    const currentOverrides = project.exportConfig?.customOverrides || {};
    updateExportConfig({ customOverrides: { ...currentOverrides, [id]: content } });
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

  const updateCustomSection = (id: string, updates: Partial<CustomSection>) => {
    if (!project) return;
    const current = project.exportConfig?.customSections || [];
    const next = current.map(s => s.id === id ? { ...s, ...updates } : s);
    updateExportConfig({ customSections: next });
  };

  const removeCustomSection = (id: string) => {
    if (!project) return;
    const current = project.exportConfig?.customSections || [];
    const nextSections = current.filter(s => s.id !== id);
    const currentOrder = project.exportConfig?.sectionOrder || [];
    const nextOrder = currentOrder.filter(oid => oid !== id);
    updateExportConfig({ customSections: nextSections, sectionOrder: nextOrder });
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

  if (currentStepId === 'casestudy') {
    const config = project.exportConfig || { theme: 'modern', primaryColor: '#3B82F6', fontFamily: 'Inter', showCover: true, showTOC: true, showAssets: true, designerName: '', designerRole: 'UX Designer', excludedSteps: [], sectionOrder: STAGES.filter(s => s.id !== 'casestudy').map(s => s.id), customSections: [] };
    const previewHtml = generateFullHtml(project, true);
    const order = config.sectionOrder || STAGES.filter(s => s.id !== 'casestudy').map(s => s.id);

    return (
      <main className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-safe ${className}`}>
        {/* Export Studio Header */}
        <div className="bg-white border-b border-slate-200 p-6 md:p-10 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
          <div className="flex items-center gap-6">
            <button onClick={() => onStepSelect(STAGES[STAGES.length - 2].id)} className="p-3 -ml-4 text-slate-400 hover:text-slate-900 active:scale-95 transition-premium"><IconArrowRight className="w-6 h-6 rotate-180" /></button>
            <div className="flex flex-col">
               <span className="label-caps mb-1">Portfolio Output</span>
               <h1 className="heading-section text-slate-900 leading-none">Export Studio</h1>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={() => setExportEditMode(!exportEditMode)} variant="outline" className="flex-1 md:flex-none">
              {exportEditMode ? <><IconEye className="w-4 h-4 mr-2" /> Preview</> : <><IconEdit className="w-4 h-4 mr-2" /> Edit Output</>}
            </Button>
            <Button onClick={() => onExport(project)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-fab">
              <IconDownload className="w-4 h-4 mr-2" /> Export Portfolio
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-10 overflow-hidden p-0 lg:p-10">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-white lg:border lg:border-slate-200 lg:card-radius p-8 md:p-10 shadow-soft flex flex-col gap-10 overflow-y-auto max-h-[35vh] lg:max-h-full">
             <section>
                <div className="flex items-center justify-between mb-8">
                   <h3 className="label-caps">Layout Sections</h3>
                   <button onClick={addCustomSection} className="text-[11px] font-black uppercase text-blue-600 hover:underline tracking-widest">+ Add New</button>
                </div>
                <div className="space-y-3">
                   {order.map((oid) => {
                     const stage = STAGES.find(s => s.id === oid);
                     const custom = config.customSections?.find(cs => cs.id === oid);
                     const isExcluded = config.excludedSteps.includes(oid);
                     if (!stage && !custom) return null;
                     return (
                       <div key={oid} className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-premium ${isExcluded ? 'bg-slate-50 text-slate-300 border-slate-100 opacity-60' : 'bg-white border-slate-200 text-slate-900 hover:border-blue-500'}`}>
                          <div className="flex items-center gap-4 truncate">
                             <div className="flex flex-col gap-1 shrink-0">
                                <button onClick={() => moveSection(oid, 'up')} className="p-1 hover:text-blue-500 transition-colors"><IconChevronDown className="w-3.5 h-3.5 rotate-180" /></button>
                                <button onClick={() => moveSection(oid, 'down')} className="p-1 hover:text-blue-500 transition-colors"><IconChevronDown className="w-3.5 h-3.5" /></button>
                             </div>
                             <span className="text-xl shrink-0">{stage?.icon || '📄'}</span>
                             <span className="text-xs font-black truncate uppercase tracking-tight">{stage?.label.split('. ')[1] || custom?.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => toggleSectionExcluded(oid)} className={`p-2 rounded-xl transition-colors ${isExcluded ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}>
                                {isExcluded ? <IconPlus className="w-4 h-4" /> : <IconClose className="w-4 h-4" />}
                             </button>
                          </div>
                       </div>
                     );
                   })}
                </div>
             </section>

             <section>
                <h3 className="label-caps mb-8">Personal Branding</h3>
                <div className="space-y-6">
                   <div className="flex flex-col gap-2">
                      <label className="label-caps text-[9px] ml-1">Color Palette</label>
                      <div className="flex gap-4 items-center">
                         <input type="color" className="w-12 h-12 rounded-2xl cursor-pointer bg-white border-4 border-slate-100 shadow-sm transition-premium hover:scale-105" value={config.primaryColor} onChange={e => updateExportConfig({ primaryColor: e.target.value })} />
                         <input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-mono uppercase font-black text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-premium" value={config.primaryColor} onChange={e => updateExportConfig({ primaryColor: e.target.value })} />
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="label-caps text-[9px] ml-1">Visual Tone</label>
                      <select 
                        className="w-full text-xs font-black p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer tracking-wider" 
                        value={config.fontFamily} 
                        onChange={e => updateExportConfig({ fontFamily: e.target.value as any })}
                      >
                         <option value="Inter">Modern Professional (Inter)</option>
                         <option value="Serif">Classic Editorial (Serif)</option>
                         <option value="Mono">Tech Minimalist (Mono)</option>
                      </select>
                   </div>
                </div>
             </section>
          </div>

          {/* Builder Canvas Area */}
          <div className="lg:col-span-8 bg-slate-100 flex-1 flex flex-col p-4 lg:p-0 overflow-hidden relative">
             <div className="w-full h-full bg-white shadow-2xl lg:card-radius overflow-hidden border border-slate-200 flex flex-col relative">
                {exportEditMode ? (
                  <div className="flex-1 overflow-y-auto p-12 md:p-18 bg-white flex flex-col gap-20 max-w-4xl mx-auto w-full selection:bg-blue-100 selection:text-blue-900">
                    {/* WYSIWYG COVER */}
                    <div className="border-l-[24px] pl-16 md:pl-20 py-20 flex flex-col gap-10 group relative" style={{ borderColor: config.primaryColor }}>
                       <div className="label-caps" style={{ color: config.primaryColor }}>Designer Portfolio Deliverable</div>
                       <input 
                         className="heading-huge text-slate-900 border-none outline-none p-0 bg-transparent w-full focus:ring-0"
                         value={project.title}
                         onChange={(e) => updateProject(project.id, { title: e.target.value })}
                       />
                       <textarea 
                         className="body-large italic border-none outline-none p-0 bg-transparent w-full resize-none focus:ring-0"
                         rows={3}
                         value={project.desc}
                         onChange={(e) => updateProject(project.id, { desc: e.target.value })}
                       />
                       <div className="flex flex-col gap-2 mt-20">
                         <input 
                            className="text-3xl font-black text-slate-900 border-none outline-none p-0 bg-transparent w-full focus:ring-0 tracking-tightest"
                            value={config.designerName}
                            placeholder="Your Name"
                            onChange={(e) => updateExportConfig({ designerName: e.target.value })}
                         />
                         <input 
                            className="label-caps tracking-[0.4em] border-none outline-none p-0 bg-transparent w-full focus:ring-0"
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
                         <div key={oid} className="flex flex-col gap-8 p-10 md:p-14 rounded-[3rem] bg-slate-50/40 border border-slate-100 hover:border-blue-300 transition-premium group relative">
                            <div className="flex items-center gap-8">
                               <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg" style={{ backgroundColor: config.primaryColor }}>
                                  {order.indexOf(oid) + 1}
                               </div>
                               {custom ? (
                                  <input 
                                    className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none p-0 flex-1 focus:ring-0 tracking-tightest"
                                    value={custom.title}
                                    onChange={(e) => updateCustomSection(oid, { title: e.target.value })}
                                  />
                               ) : (
                                  <h2 className="text-4xl font-black text-slate-900 tracking-tightest uppercase">{stage?.label.split('. ')[1]}</h2>
                               )}
                            </div>
                            <textarea 
                               className="w-full min-h-[300px] bg-white border border-slate-200 rounded-[2rem] p-10 text-slate-800 leading-relaxed text-xl focus:ring-[12px] focus:ring-blue-500/5 outline-none transition-premium shadow-soft font-sans placeholder:text-slate-200"
                               value={content}
                               placeholder={`Describe the ${custom?.title || stage?.label}...`}
                               onChange={(e) => custom ? updateCustomSection(oid, { content: e.target.value }) : updateOverride(oid, e.target.value)}
                            />
                            <div className="absolute top-10 right-10 label-caps opacity-0 group-hover:opacity-100">Live Editor</div>
                         </div>
                       );
                    })}
                    
                    <div className="py-32 flex justify-center">
                       <Button onClick={addCustomSection} variant="outline" className="rounded-full border-dashed border-2 px-12 py-10 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50">
                          <IconPlus className="w-6 h-6 mr-4" /> Expand Case Study Structure
                       </Button>
                    </div>
                  </div>
                ) : (
                  <iframe srcDoc={previewHtml} className="w-full h-full border-0" sandbox="allow-same-origin" />
                )}
             </div>
          </div>
        </div>
      </main>
    );
  }

  // STANDARD WORKSPACE (PHASES)
  return (
    <main className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden ${className}`} role="main">
      {/* Verification Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[110] flex items-center justify-center animate-out fade-out duration-1000 delay-2000">
           <div className="bg-white/95 backdrop-blur-2xl p-16 rounded-[4rem] shadow-fab border border-blue-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
              <span className="text-8xl mb-8">💎</span>
              <h3 className="heading-section text-slate-900 text-center">Milestone Verified</h3>
              <p className="text-slate-500 font-black text-xl mt-3 uppercase tracking-widest">Process Authenticated</p>
           </div>
        </div>
      )}

      {/* Main Workspace Header */}
      <div className="bg-white border-b border-slate-200 p-6 md:p-10 shadow-sm flex flex-col gap-6 shrink-0 pt-safe">
        <div className="flex justify-between items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-4 mb-3">
              <span className="label-caps text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">Step {currentStepIndex + 1}</span>
              {isStepComplete && <span className="bg-emerald-50 text-emerald-600 label-caps px-4 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-3"><IconCheck className="w-3.5 h-3.5" /> Accomplished</span>}
            </div>
            <h1 className="heading-section text-slate-900 truncate leading-tight">{currentStage.label.replace(/^\d+\.\s/, '')}</h1>
          </div>
          <div className="flex items-center gap-6">
             <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`p-4 rounded-[1.5rem] border transition-premium active-scale ${isPreviewMode ? 'bg-slate-900 text-white border-slate-900 shadow-glow' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <IconEye className="w-7 h-7" />
             </button>
             <ProgressRing progress={progress} radius={32} stroke={5} className="text-blue-600" />
          </div>
        </div>

        {/* Responsive Tab Switcher (Mobile Only) */}
        <div className="md:hidden flex bg-slate-100 p-2 mx-auto w-[90%] rounded-[2.5rem]">
          <button onClick={() => setActiveMobileTab('strategy')} className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-widest rounded-[2rem] transition-premium active-scale ${activeMobileTab === 'strategy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            <IconFile className="w-4 h-4" /> Strategy
          </button>
          <button onClick={() => setActiveMobileTab('evidence')} className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-widest rounded-[2rem] transition-premium active-scale ${activeMobileTab === 'evidence' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            <IconLayout className="w-4 h-4" /> Proof <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black">{stepAssets.length}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-0 md:gap-10 overflow-hidden p-0 md:p-10">
        {/* Strategy Editor Pane */}
        <div className={`flex flex-col min-h-0 flex-1 h-full bg-white md:bg-transparent transition-premium ${activeMobileTab === 'strategy' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 absolute md:relative opacity-0 md:opacity-100'}`}>
          <div className="bg-white md:border md:border-slate-200 md:card-radius shadow-soft flex-1 flex flex-col relative overflow-hidden">
            <div className="flex flex-col border-b border-slate-100 bg-slate-50/40 shrink-0">
              <div className="flex items-center justify-between px-10 py-6">
                 <button onClick={() => setIsGuideOpen(true)} className="bg-slate-900 text-white rounded-full px-8 py-4 label-caps flex items-center shadow-fab active-scale transition-premium hover:bg-black">
                    <IconLayout className="w-5 h-5 mr-4" /> Specialist Tools
                 </button>
                 <div className={`label-caps text-[10px] ${saveStatus === 'saved' ? 'text-emerald-500' : 'text-slate-300'}`}>
                     {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Synced' : ''}
                 </div>
              </div>
              
              {phaseTemplates.length > 0 && !isPreviewMode && (
                <div className="px-10 pb-6 flex gap-4 overflow-x-auto hide-scrollbar">
                   {phaseTemplates.map(t => (
                     <button key={t.key} onClick={() => handleInsert(t.content)} className="px-6 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-premium whitespace-nowrap active-scale shadow-sm">+ {t.label}</button>
                   ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 relative overflow-hidden">
              {isPreviewMode ? (
                <div className="absolute inset-0 p-10 md:p-14 overflow-y-auto prose prose-slate max-w-none bg-white font-sans selection:bg-blue-100">
                  <div className="text-slate-800 leading-[2.1] text-lg font-medium" dangerouslySetInnerHTML={{ __html: parseMarkdown(notes) }} />
                  {notes.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-200 italic"><IconFile className="w-20 h-20 mb-8 opacity-20" /> No strategy defined.</div>}
                </div>
              ) : (
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  onBlur={handleSave} 
                  placeholder={`Phase Guide: ${currentStage.help}\n\nOutline your approach here...`}
                  className="w-full h-full bg-white p-10 md:p-14 resize-none focus:outline-none text-slate-800 leading-[2] text-xl font-medium font-sans placeholder:text-slate-200"
                />
              )}
            </div>
          </div>
        </div>

        {/* Assets Pane */}
        <div className={`flex flex-col flex-1 min-h-0 h-full bg-slate-50 md:bg-transparent transition-premium ${activeMobileTab === 'evidence' ? 'translate-x-0' : '-translate-x-full md:translate-x-0 absolute md:relative opacity-0 md:opacity-100'}`}>
          <div className="bg-white md:border md:border-slate-200 md:card-radius shadow-soft flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-slate-50/40 shrink-0">
               <h3 className="label-caps">Process Artifacts</h3>
               <label className="cursor-pointer active-scale transition-premium">
                  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onUploadAsset(e.target.files[0])} />
                  <div className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-full label-caps shadow-lg flex items-center hover:bg-slate-900 hover:text-white">
                    <IconPlus className="w-5 h-5 mr-4" /> Add Artifact
                  </div>
               </label>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50/20">
              {stepAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-16">
                   <div className="w-32 h-32 rounded-[3rem] bg-white border border-slate-100 shadow-soft flex items-center justify-center mb-10 transition-premium hover:rotate-3">
                     <IconFile className="w-14 h-14 text-slate-100" />
                   </div>
                   <h4 className="heading-section text-slate-300 text-xl uppercase mb-4 tracking-widest">Vault Empty</h4>
                   <p className="body-large text-slate-400 max-w-[300px]">Visual proof of your work increases the perceived value of your design solutions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-12">
                  {[...stepAssets].reverse().map((asset, i) => {
                    const originalIdx = project.assets.indexOf(asset);
                    return (
                      <div key={i} className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-soft group animate-in slide-in-from-bottom-8 duration-500">
                        <div className="relative aspect-video bg-slate-100 rounded-[2rem] overflow-hidden mb-8 border border-slate-100 shadow-inner">
                          <img src={asset.url || asset.dataURL} className="w-full h-full object-contain" alt={asset.name} />
                          <div className="absolute top-6 right-6 flex gap-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-premium">
                             <button onClick={() => window.open(asset.url || asset.dataURL, '_blank')} className="p-5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl text-slate-900 active-scale"><IconEye className="w-6 h-6" /></button>
                             <button onClick={() => deleteAsset(originalIdx)} className="p-5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl text-red-500 active-scale"><IconTrash className="w-6 h-6" /></button>
                          </div>
                        </div>
                        <div className="px-2">
                          <div className="flex justify-between items-center mb-6">
                            <h5 className="label-caps text-slate-900 tracking-tight text-xs">{asset.name}</h5>
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{new Date(asset.createdAt).toLocaleDateString()}</span>
                          </div>
                          <textarea 
                            placeholder="Add strategic context to this proof..." 
                            className="w-full text-lg p-8 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-[12px] focus:ring-blue-500/5 transition-premium resize-none h-40 text-slate-700 leading-relaxed font-sans placeholder:text-slate-300"
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

      {/* Primary Interaction Footer (Desktop ONLY) */}
      <div className="hidden md:flex bg-white p-6 md:px-10 justify-between items-center z-50 pb-safe shadow-sheet border-t border-slate-100">
         <button 
           onClick={() => prevStep && onStepSelect(prevStep.id)} 
           className={`flex flex-col items-center gap-1 label-caps p-2 active-scale transition-premium ${!prevStep && 'invisible opacity-0'}`}
         >
           <IconArrowRight className="w-5 h-5 rotate-180" /> 
           <span className="text-[8px]">Back</span>
         </button>
         
         <div className="flex gap-8 items-center">
            <button 
                onClick={toggleStepCompletion} 
                className={`w-16 h-16 rounded-[2rem] flex flex-col items-center justify-center transition-premium active-scale border-4 ${isStepComplete ? 'bg-emerald-500 border-emerald-100 text-white shadow-fab' : 'bg-white border-slate-100 text-slate-200 hover:border-slate-300'}`}
            >
                <IconCheck className="w-8 h-8" />
                <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">{isStepComplete ? 'Done' : 'Finish'}</span>
            </button>
            <Button onClick={() => nextStep ? onStepSelect(nextStep.id) : onStepSelect('casestudy')} size="lg" className="bg-slate-900 text-white px-10 rounded-full shadow-fab">
                {nextStep ? 'Next Phase' : 'Compile'} <IconArrowRight className="w-5 h-5 ml-4" />
            </Button>
         </div>
         
         <div className="w-10 invisible" /> {/* Spacer for symmetry */}
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