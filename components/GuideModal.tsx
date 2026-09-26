import React, { useState, useEffect, useMemo } from 'react';
import { STAGES, TEMPLATES, RichTemplate } from '../constants';
import { Button } from './ui/Button';
import { IconClose, IconPlus, IconCheck, IconArrowRight, IconBook } from './ui/Icons';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  currentStepId: string;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onInsert, currentStepId }) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'frameworks'>('learn');
  const [selectedStepId, setSelectedStepId] = useState(currentStepId);
  const [selectedTemplate, setSelectedTemplate] = useState<RichTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [insertionStep, setInsertionStep] = useState<'list' | 'variables'>('list');

  const stage = useMemo(() => STAGES.find(s => s.id === selectedStepId) || STAGES[0], [selectedStepId]);
  const relevantTemplates = useMemo(() => 
    TEMPLATES.filter(t => t.category === stage.templateCategory || t.key === stage.id), 
    [stage]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedStepId(currentStepId);
      setActiveTab('learn');
      setInsertionStep('list');
      setSelectedTemplate(null);
    }
  }, [isOpen, currentStepId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTemplateSelect = (t: RichTemplate) => {
    const regex = /{{(.*?)}}/g;
    const matches = t.content.match(regex);
    if (matches) {
      const vars: Record<string, string> = {};
      matches.forEach(m => {
        const key = m.replace(/{{|}}/g, '');
        vars[key] = '';
      });
      setVariables(vars);
      setSelectedTemplate(t);
      setInsertionStep('variables');
    } else {
      onInsert(t.content);
      onClose();
    }
  };

  const handleInsertFinal = () => {
    if (!selectedTemplate) return;
    let finalContent = selectedTemplate.content;
    
    Object.entries(variables).forEach(([key, val]) => {
      const placeholder = `{{${key}}}`;
      const replacement = (val as string).trim() || `[${key}]`;
      finalContent = finalContent.split(placeholder).join(replacement);
    });

    onInsert(finalContent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop scrim */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[85] bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Dockable Slide-out Drawer */}
      <aside 
        className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[460px] md:w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden"
        aria-label="UX Methodology Drawer"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IconBook className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Methodology Guide</span>
                <span>·</span>
                <span>Stage Reference</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <select 
                  value={selectedStepId} 
                  onChange={(e) => setSelectedStepId(e.target.value)}
                  className="text-sm font-bold text-slate-900 bg-transparent outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5 hover:text-blue-600 transition-colors truncate max-w-[280px]"
                >
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Close Drawer (Esc)"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <button 
            onClick={() => setActiveTab('learn')}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === 'learn' 
                ? 'border-blue-600 text-blue-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Objectives & Best Practices
          </button>
          <button 
            onClick={() => { setActiveTab('frameworks'); setInsertionStep('list'); }}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === 'frameworks' 
                ? 'border-blue-600 text-blue-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Templates ({relevantTemplates.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/50 space-y-6">
          {activeTab === 'learn' && (
            <div className="space-y-6">
              {/* Objective */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Stage Objective</span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-3 border-blue-500 pl-3">
                  "{stage.guide?.why}"
                </p>
              </div>

              {/* Best Practices */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <IconCheck className="w-4 h-4 text-emerald-600" /> Best Practices & Criteria
                </h4>
                <ul className="space-y-2.5">
                  {stage.guide?.bestPractices.map((bp, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                        {i + 1}
                      </span>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Deliverables */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Key Artifacts & Deliverables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stage.guide?.deliverables.map((d, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Template Transition CTA */}
              {relevantTemplates.length > 0 && (
                <div className="pt-2 flex justify-center">
                  <Button 
                    onClick={() => { setActiveTab('frameworks'); setInsertionStep('list'); }} 
                    variant="outline" 
                    className="w-full text-xs font-semibold py-2.5"
                  >
                    Browse {relevantTemplates.length} Suggested Frameworks <IconArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'frameworks' && (
            <div>
              {insertionStep === 'list' ? (
                <div className="space-y-3">
                  {relevantTemplates.length > 0 ? (
                    relevantTemplates.map(t => (
                      <div 
                        key={t.key} 
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs group"
                      >
                        <div className="mb-3">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {t.label}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 font-mono line-clamp-2 leading-relaxed">
                            {t.preview}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleTemplateSelect(t)} 
                          className="w-full bg-slate-900 hover:bg-black text-white text-xs font-semibold"
                        >
                          <IconPlus className="w-3.5 h-3.5 mr-1" /> Insert into Notes
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-slate-400 italic text-xs">
                      No specific templates configured for this stage yet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex justify-between items-baseline pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Customize: {selectedTemplate?.label}</h3>
                    <button 
                      onClick={() => setInsertionStep('list')} 
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Back
                    </button>
                  </div>
                  <div className="space-y-3">
                    {Object.keys(variables).map(key => (
                      <div key={key}>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">{key}</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                          value={variables[key]}
                          onChange={e => setVariables({...variables, [key]: e.target.value})}
                          placeholder={`Enter ${key}...`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setInsertionStep('list')}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleInsertFinal} 
                      className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-semibold"
                    >
                      Insert into Notes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
