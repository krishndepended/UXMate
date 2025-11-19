
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
    // Attempt to parse example to find values (simple heuristic) OR just use dummy data based on keys
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
    // Replace variables
    let finalContent = rawContent;
    Object.entries(variables).forEach(([key, val]) => {
      const replacement = (val as string).trim() || `[${key}]`;
      const regex = new RegExp(`{{${key}}}`, 'g');
      finalContent = finalContent.replace(regex, replacement);
    });

    const timestamp = new Date().toLocaleString();
    
    if (type === 'block') {
      // HTML Block structure
      const block = `
<hr class="my-4 border-white/10" />
<details open class="group bg-black/20 border border-white/10 rounded-lg overflow-hidden">
<summary class="cursor-pointer p-3 font-bold bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between outline-none focus:bg-white/10">
  <span>📄 ${template.label}</span>
  <span class="text-[10px] font-normal text-muted uppercase tracking-widest opacity-70">${timestamp}</span>
</summary>
<div class="p-4 text-gray-300 whitespace-pre-wrap leading-relaxed">
${finalContent}
</div>
</details>
<hr class="my-4 border-white/10" />
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Customize Template</h2>
              <p className="text-xs text-muted">Fill in the placeholders for <strong>{selectedTemplate.label}</strong></p>
            </div>
            <button onClick={() => setStep('list')} className="text-muted hover:text-white"><IconClose className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.keys(variables).map(key => (
                 <div key={key}>
                   <label className="block text-xs uppercase font-bold text-muted mb-1 tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                   <input 
                     type="text" 
                     className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none focus:ring-1 focus:ring-accent transition-all"
                     placeholder={`Enter ${key}...`}
                     value={variables[key]}
                     onChange={e => setVariables({...variables, [key]: e.target.value})}
                     autoFocus={key === Object.keys(variables)[0]}
                   />
                 </div>
               ))}
             </div>
             <div className="mt-6 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleFillExample} className="text-accent hover:bg-accent/10">
                   <IconBeaker className="w-4 h-4 mr-2" /> Fill with Example Data
                </Button>
             </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/20 flex justify-between items-center">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-surface border border-white/10 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
             <h2 className="text-xl font-bold text-white">Template Library</h2>
             <p className="text-xs text-muted">Accelerate your workflow with structured guides.</p>
          </div>
          <button 
            ref={closeBtnRef}
            onClick={onClose} 
            className="text-muted hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/5 bg-black/20 p-4 space-y-1 overflow-y-auto hidden md:block">
            <h3 className="text-xs font-bold text-muted uppercase mb-2 tracking-wide">Categories</h3>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-accent text-surface' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-surface">
            <div className="p-4 border-b border-white/5 flex gap-3 bg-surface z-10">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-[#161b22]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTemplates.map(t => {
                   const isSampleOpen = showingSampleId === t.key;
                   return (
                    <div key={t.key} className="bg-surface border border-white/5 rounded-xl p-4 hover:border-accent/50 transition-all flex flex-col group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-100">{t.label}</h3>
                          <span className="text-[10px] bg-white/5 text-muted px-2 py-0.5 rounded-full border border-white/5 uppercase">{t.category}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">{t.desc}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {t.tags?.map(tag => (
                          <span key={tag} className="inline-flex items-center text-[10px] text-gray-500">
                             <IconTag className="w-3 h-3 mr-1 opacity-50" /> {tag}
                          </span>
                        ))}
                      </div>

                      {/* Preview / Sample Area */}
                      <div className="mt-auto bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                        <div className="p-3 text-xs text-gray-400 font-mono leading-relaxed border-b border-white/5 relative">
                           {isSampleOpen ? (
                             <div className="whitespace-pre-wrap text-gray-300">{t.example}</div>
                           ) : (
                             <div className="line-clamp-3 opacity-70">{t.preview}</div>
                           )}
                           <button 
                             onClick={() => setShowingSampleId(isSampleOpen ? null : t.key)}
                             className="absolute top-2 right-2 text-[10px] flex items-center gap-1 bg-surface border border-white/10 px-2 py-1 rounded hover:text-white transition-colors"
                           >
                             <IconBeaker className="w-3 h-3" /> {isSampleOpen ? 'Hide Sample' : 'View Sample'}
                           </button>
                        </div>
                        <div className="p-2 bg-white/5 flex gap-2">
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
                <div className="h-full flex items-center justify-center text-muted opacity-50">No templates found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};