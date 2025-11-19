import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TEMPLATES, RichTemplate } from '../constants';
import { Button } from './ui/Button';
import { IconClose, IconSearch, IconTag, IconPlus, IconBeaker, IconArrowRight, IconCheck } from './ui/Icons';

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
    Object.entries(variables).forEach(([key, val]) => {
      const replacement = (val as string).trim() || `[${key}]`;
      const regex = new RegExp(`{{${key}}}`, 'g');
      finalContent = finalContent.replace(regex, replacement);
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

  // RENDER: VARIABLE INPUT STEP
  if (step === 'variables' && selectedTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Customize Template</h2>
              <p className="text-xs text-slate-500">Fill in the placeholders for <strong>{selectedTemplate.label}</strong></p>
            </div>
            <button onClick={() => setStep('list')} className="text-slate-400 hover:text-slate-900"><IconClose className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.keys(variables).map(key => (
                 <div key={key}>
                   <label className="block text-xs uppercase font-bold text-slate-500 mb-1 tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                     placeholder={`Enter ${key}...`}
                     value={variables[key]}
                     onChange={e => setVariables({...variables, [key]: e.target.value})}
                     autoFocus={key === Object.keys(variables)[0]}
                   />
                 </div>
               ))}
             </div>
             <div className="mt-6 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleFillExample} className="text-blue-600 hover:bg-blue-50">
                   <IconBeaker className="w-4 h-4 mr-2" /> Fill with Example Data
                </Button>
             </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <Button variant="ghost" onClick={() => setStep('list')}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleInsertFinal(selectedTemplate.content, selectedTemplate, 'plain')}>
                Insert Plain Text
              </Button>
              <Button onClick={() => handleInsertFinal(selectedTemplate.content, selectedTemplate, 'block')}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
             <h2 className="text-xl font-bold text-slate-900">Template Library</h2>
             <p className="text-xs text-slate-500">Accelerate your workflow with structured guides.</p>
          </div>
          <button 
            ref={closeBtnRef}
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-slate-100 bg-slate-50 p-4 space-y-1 overflow-y-auto hidden md:block">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Categories</h3>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex gap-3 bg-white z-10">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTemplates.map(t => {
                   const isSampleOpen = showingSampleId === t.key;
                   return (
                    <div key={t.key} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all flex flex-col group shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">{t.label}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase">{t.category}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 mb-3">{t.desc}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {t.tags?.map(tag => (
                          <span key={tag} className="inline-flex items-center text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                             <IconTag className="w-3 h-3 mr-1 opacity-50" /> {tag}
                          </span>
                        ))}
                      </div>

                      {/* Preview / Sample Area */}
                      <div className="mt-auto bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <div className="p-3 text-xs text-slate-500 font-mono leading-relaxed border-b border-slate-200 relative">
                           {isSampleOpen ? (
                             <div className="whitespace-pre-wrap text-slate-700">{t.example}</div>
                           ) : (
                             <div className="line-clamp-3 opacity-70">{t.preview}</div>
                           )}
                           <button 
                             onClick={() => setShowingSampleId(isSampleOpen ? null : t.key)}
                             className="absolute top-2 right-2 text-[10px] flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded hover:text-blue-600 transition-colors"
                           >
                             <IconBeaker className="w-3 h-3" /> {isSampleOpen ? 'Hide Sample' : 'View Sample'}
                           </button>
                        </div>
                        <div className="p-2 bg-white flex gap-2">
                          <Button 
                            size="sm" 
                            className="w-full justify-center" 
                            onClick={() => handleTemplateSelect(t)}
                          >
                            <IconPlus className="w-3 h-3 mr-1" /> Use Template
                          </Button>
                        </div>
                      </div>
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
    </div>
  );
};