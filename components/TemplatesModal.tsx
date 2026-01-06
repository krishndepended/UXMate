import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TEMPLATES, RichTemplate } from '../constants';
import { Button } from './ui/Button';
import { IconClose, IconSearch, IconTag, IconPlus, IconBeaker } from './ui/Icons';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<RichTemplate | null>(null);
  const [step, setStep] = useState<'list' | 'variables'>('list');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showingSampleId, setShowingSampleId] = useState<string | null>(null);

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const touchStartY = useRef<number>(0);

  // Extract categories
  const categories = useMemo(() => {
    const cats = new Set<string>(['All']);
    TEMPLATES.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, []);

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch = 
        t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = activeCategory === 'All' || t.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchTerm, activeCategory]);

  useEffect(() => {
    if (isOpen) {
      setStep('list');
      setSearchTerm('');
      setSelectedTemplate(null);
      setVariables({});
      setShowingSampleId(null);
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Swipe to close logic
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    // If swiped down more than 75px
    if (touchEndY - touchStartY.current > 75) {
      onClose();
    }
  };

  // Parse variables from template content: {{variableName}}
  const extractVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const matches = content.match(regex);
    if (!matches) return [];
    // Remove braces and duplicates
    return Array.from(new Set(matches.map(m => m.replace(/{{|}}/g, ''))));
  };

  const handleTemplateSelect = (t: RichTemplate) => {
    const vars = extractVariables(t.content);
    if (vars.length > 0) {
      // Initialize variables with empty strings
      const initialVars: Record<string, string> = {};
      vars.forEach(v => initialVars[v] = '');
      setVariables(initialVars);
      setSelectedTemplate(t);
      setStep('variables');
    } else {
      // No variables, just select for immediate insert
      setSelectedTemplate(t);
      handleInsertFinal(t.content, t, 'block');
    }
  };

  const handleFillExample = () => {
    if (!selectedTemplate) return;
    const dummyData: Record<string, string> = {
      name: 'Sarah',
      role: 'Product Designer',
      date: new Date().toLocaleDateString(),
      topic: 'Checkout Flow',
      problem: 'users cannot find the pay button',
      rootCause: 'it is below the fold',
      focusArea: 'layout hierarchy',
      benefit: 'conversion increases',
      metric: 'sales',
      percentage: '15',
      age: '28',
      quote: 'I want things to be simple.',
      goal1: 'Save time',
      goal2: 'Reduce errors',
      painPoint1: 'Too many steps',
      painPoint2: 'Slow loading',
      techLevel: 'Moderate',
      values: 'Efficiency',
      participantName: 'John Doe',
      interviewerName: 'Me',
      task: 'buy a ticket',
      projectTitle: 'Redesign Project',
      myRole: 'UX Lead',
      timeline: '2 weeks',
      userCount: '10',
      insight: 'Price is not the main factor',
      launchDate: 'Q4 2024'
    };
    
    setVariables(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (dummyData[key]) next[key] = dummyData[key];
        else next[key] = `[${key} example]`;
      });
      return next;
    });
  };

  const handleInsertFinal = (rawContent: string, template: RichTemplate, type: 'block' | 'plain') => {
    let finalContent = rawContent;
    
    // Robust placeholder replacement
    Object.entries(variables).forEach(([key, val]) => {
      const placeholder = `{{${key}}}`;
      const replacement = (val as string).trim() || `[${key}]`;
      finalContent = finalContent.split(placeholder).join(replacement);
    });

    const timestamp = new Date().toLocaleString();
    
    if (type === 'block') {
      const block = `
<hr class="my-4 border-gray-200" />
<details open class="group bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
<summary class="cursor-pointer p-3 font-bold bg-white hover:bg-slate-50 transition-colors flex items-center justify-between outline-none focus:bg-slate-50">
  <span class="text-slate-800">📄 ${template.label}</span>
  <span class="text-[10px] font-normal text-slate-400 uppercase tracking-widest opacity-70">${timestamp}</span>
</summary>
<div class="p-4 text-slate-700 whitespace-pre-wrap leading-relaxed">
${finalContent}
</div>
</details>
<hr class="my-4 border-gray-200" />
`;
      onInsert(block);
    } else {
      onInsert(finalContent);
    }
    onClose();
  };

  // Shared Mobile Handle Component
  const MobileHandle = () => (
    <div 
      className="md:hidden h-10 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none border-b border-slate-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
       <div className="w-12 h-1.5 rounded-full bg-slate-200" />
    </div>
  );

  // RENDER: VARIABLE INPUT STEP
  if (step === 'variables' && selectedTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden transition-transform">
          <MobileHandle />
          
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Customize Template</h2>
              <p className="text-xs text-slate-500 mt-1">Fill in placeholders for <strong>{selectedTemplate.label}</strong></p>
            </div>
            <button onClick={() => setStep('list')} className="text-slate-400 hover:text-slate-900 hidden md:block"><IconClose className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {Object.keys(variables).map(key => (
                 <div key={key}>
                   <label className="block text-xs uppercase font-bold text-slate-500 mb-1.5 tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                     placeholder={`Enter ${key}...`}
                     value={variables[key]}
                     onChange={e => setVariables({...variables, [key]: e.target.value})}
                     autoFocus={key === Object.keys(variables)[0]}
                   />
                 </div>
               ))}
             </div>
             <div className="mt-8 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleFillExample} className="text-blue-600 hover:bg-blue-50">
                   <IconBeaker className="w-4 h-4 mr-2" /> Use Example Data
                </Button>
             </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse md:flex-row justify-between items-center gap-3 md:gap-0 pb-safe">
            <Button variant="ghost" onClick={() => setStep('list')} className="w-full md:w-auto">Back</Button>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <Button variant="outline" className="w-full md:w-auto justify-center" onClick={() => handleInsertFinal(selectedTemplate.content, selectedTemplate, 'plain')}>
                Insert as Text
              </Button>
              <Button className="w-full md:w-auto justify-center" onClick={() => handleInsertFinal(selectedTemplate.content, selectedTemplate, 'block')}>
                Insert as Block
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: LIST STEP
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[95vh] md:h-[85vh] overflow-hidden transition-transform">
        <MobileHandle />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
             <h2 className="text-xl font-bold text-slate-900">Template Library</h2>
             <p className="text-xs text-slate-500 mt-0.5">Accelerate your workflow with structured guides.</p>
          </div>
          <button 
            ref={closeBtnRef}
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-full overflow-hidden bg-slate-50/30">
          
          {/* Controls Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-white z-10">
             {/* Categories Pills */}
             <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                      activeCategory === cat 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>

             {/* Search */}
             <div className="relative w-full md:w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto p-6 pb-safe">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(t => {
                   const isSampleOpen = showingSampleId === t.key;
                   return (
                    <div key={t.key} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-all flex flex-col h-full shadow-sm group">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 text-base">{t.label}</h3>
                        <button 
                             onClick={() => setShowingSampleId(isSampleOpen ? null : t.key)}
                             className="text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 px-2 py-1 rounded border border-slate-100"
                           >
                             {isSampleOpen ? 'Hide Sample' : 'View Sample'}
                        </button>
                      </div>
                      
                      {/* Description */}
                      <p className="text-sm text-slate-500 mb-3 leading-relaxed">{t.desc}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                        {t.tags?.map(tag => (
                          <span key={tag} className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                             <IconTag className="w-3 h-3 mr-1 opacity-40" /> {tag}
                          </span>
                        ))}
                      </div>

                      {/* Preview Area */}
                      {isSampleOpen ? (
                         <div className="mb-4 bg-slate-50 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto shadow-inner">
                           {t.example}
                         </div>
                      ) : (
                         <div className="mb-4 bg-slate-50 rounded-lg border border-slate-200 p-3 text-xs text-slate-400 font-mono line-clamp-3 italic">
                           {t.preview}
                         </div>
                      )}

                      {/* CTA */}
                      <Button 
                        className="w-full justify-center mt-auto" 
                        onClick={() => handleTemplateSelect(t)}
                      >
                        <IconPlus className="w-4 h-4 mr-1.5" /> Use Template
                      </Button>
                    </div>
                   );
                })}
              </div>
              {filteredTemplates.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 opacity-50">No templates found.</div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};