import React, { useState, useEffect, useRef, useMemo } from 'react';
import { STAGES, TEMPLATES, RichTemplate } from '../constants';
import { Button } from './ui/Button';
import { IconClose, IconBeaker, IconPlus, IconCheck, IconArrowRight, IconLayout, IconClock } from './ui/Icons';

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
      // Fix: Cast val to string to resolve 'unknown' type error during Object.entries on Record<string, string>
      const replacement = (val as string).trim() || `[${key}]`;
      finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
    });
    onInsert(finalContent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col h-[92vh] md:h-[80vh] overflow-hidden">
        
        {/* Header: Context Switcher */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <IconLayout className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-lg font-extrabold text-slate-900 leading-tight">UX Process Guide</h2>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-blue-500 tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded">Active Milestone</span>
                  <select 
                    value={selectedStepId} 
                    onChange={(e) => setSelectedStepId(e.target.value)}
                    className="text-xs font-bold text-slate-500 bg-transparent outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5 hover:text-blue-600 transition-colors"
                  >
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
               </div>
             </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 md:static p-2 text-slate-400 hover:text-slate-900 transition-colors"><IconClose className="w-6 h-6" /></button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-4 md:px-6 bg-slate-50 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('learn')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'learn' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            Learn
          </button>
          <button 
            onClick={() => { setActiveTab('frameworks'); setInsertionStep('list'); }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'frameworks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            Frameworks
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'learn' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-3">The Objective</h3>
                <p className="text-lg md:text-xl text-slate-700 font-medium leading-relaxed italic border-l-4 border-blue-100 pl-6">
                  "{stage.guide?.why}"
                </p>
              </section>

              <div className="grid md:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                    <IconCheck className="w-4 h-4 mr-2 text-emerald-500" /> Best Practices
                  </h3>
                  <ul className="space-y-4">
                    {stage.guide?.bestPractices.map((bp, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600 leading-snug">
                         <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-[10px]">{i+1}</span>
                         {bp}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                    <IconPlus className="w-4 h-4 mr-2 text-blue-500" /> Pro Deliverables
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stage.guide?.deliverables.map((d, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                        {d}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
              
              <div className="pt-8 border-t border-slate-50 flex justify-center">
                 <Button onClick={() => setActiveTab('frameworks')} className="bg-blue-600 rounded-full px-8 shadow-xl shadow-blue-500/20">
                    See Suggested Frameworks <IconArrowRight className="w-4 h-4 ml-2" />
                 </Button>
              </div>
            </div>
          )}

          {activeTab === 'frameworks' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              {insertionStep === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {relevantTemplates.length > 0 ? (
                     relevantTemplates.map(t => (
                       <div key={t.key} className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 transition-all group flex flex-col justify-between shadow-sm">
                          <div>
                            <h4 className="font-bold text-slate-900 mb-1">{t.label}</h4>
                            <p className="text-xs text-slate-400 mb-4 font-mono line-clamp-2 italic">{t.preview}</p>
                          </div>
                          <Button size="sm" onClick={() => handleTemplateSelect(t)} className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                             Use This Framework
                          </Button>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-full py-20 text-center">
                        <p className="text-slate-400 italic text-sm">No specific frameworks suggested for this stage yet.</p>
                     </div>
                   )}
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-6">
                   <div className="flex justify-between items-end">
                      <h3 className="text-lg font-bold text-slate-900">Customize: {selectedTemplate?.label}</h3>
                      <button onClick={() => setInsertionStep('list')} className="text-xs text-blue-600 font-bold hover:underline">Change Template</button>
                   </div>
                   <div className="space-y-4">
                      {Object.keys(variables).map(key => (
                        <div key={key}>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">{key}</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            value={variables[key]}
                            onChange={e => setVariables({...variables, [key]: e.target.value})}
                            placeholder={`Enter ${key}...`}
                          />
                        </div>
                      ))}
                   </div>
                   <div className="pt-6 flex gap-3">
                      <Button variant="ghost" onClick={() => setInsertionStep('list')}>Cancel</Button>
                      <Button onClick={handleInsertFinal} className="flex-1 bg-blue-600 shadow-lg shadow-blue-500/20">Insert into Document</Button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile Swipe-to-close Indicator */}
        <div className="md:hidden py-4 flex justify-center border-t border-slate-50 bg-white pb-safe">
           <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
};