import React, { useState, useEffect } from 'react';
import { Project, ExportConfig } from '../types';
import { generateFullHtml, downloadCaseStudy, exportToPrintable } from '../utils/exporter';
import { Button } from './ui/Button';
import { IconClose, IconDownload, IconFile, IconCheck, IconLayout, IconEye, IconEdit } from './ui/Icons';

interface ExportModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, isOpen, onClose, onUpdateProject }) => {
  const [format, setFormat] = useState<'html' | 'pdf'>('html');
  const [previewHtml, setPreviewHtml] = useState('');
  const [estimatedSize, setEstimatedSize] = useState<string>('Calculating...');
  const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');
  
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // Local config initialized from project or defaults
  const [config, setConfig] = useState<ExportConfig>(() => {
    return project?.exportConfig || {
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
  });

  useEffect(() => {
    if (project && isOpen) {
      const mergedProject = { ...project, exportConfig: config };
      const html = generateFullHtml(mergedProject, config.showAssets);
      setPreviewHtml(html);
      
      const sizeBytes = new Blob([html]).size;
      const kb = Math.round(sizeBytes / 1024);
      
      if (format === 'html') {
        setEstimatedSize(`~${kb} KB`);
      } else {
        const pdfEst = Math.round(kb * 1.5 + 500); 
        setEstimatedSize(`~${pdfEst} KB`);
      }
    }
  }, [project, isOpen, format, config]);

  const updateConfig = (updates: Partial<ExportConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    // If we have an update callback, persist it
    if (onUpdateProject && project) {
      onUpdateProject(project.id, { exportConfig: next });
    }
  };

  if (!isOpen || !project) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    
    // Create a virtual project with the current config tweaks
    const finalProject = { ...project, exportConfig: config };

    try {
      if (format === 'html') {
        setStatusText('Preparing HTML...');
        setProgress(50);
        await new Promise(r => setTimeout(r, 500)); 
        downloadCaseStudy(finalProject, config.showAssets);
        setProgress(100);
        setStatusText('Download started!');
        setTimeout(() => {
           setIsExporting(false);
           onClose();
        }, 1000);
      } else {
        setStatusText('Inlining images & preparing document...');
        setProgress(30);
        await new Promise(r => setTimeout(r, 300));
        
        const result = await exportToPrintable(finalProject, config.showAssets);
        
        setProgress(100);
        if (result.method === 'print') {
          setStatusText('Print dialog opened!');
        } else {
          setStatusText('Popup blocked: HTML downloaded.');
        }

        setTimeout(() => {
           setIsExporting(false);
           onClose();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setStatusText('Export failed.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end lg:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 lg:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full lg:max-w-6xl h-[95vh] lg:h-[90vh] rounded-t-[2.5rem] lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <IconDownload className="w-5 h-5 lg:w-6 lg:h-6" />
             </div>
             <div className="min-w-0">
               <h2 className="text-lg lg:text-xl font-black text-slate-900 leading-tight">Export Studio</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">Project: {project.title}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex bg-slate-50 border-b border-slate-100 p-1.5 mx-6 my-4 rounded-2xl shrink-0">
           <button 
             onClick={() => setMobileTab('config')} 
             className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-premium ${mobileTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
           >
             <IconEdit className="w-4 h-4" /> Config
           </button>
           <button 
             onClick={() => setMobileTab('preview')} 
             className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-premium ${mobileTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
           >
             <IconEye className="w-4 h-4" /> Preview
           </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Settings Tab / Panel */}
          <div className={`w-full lg:w-96 bg-slate-50 border-r border-slate-100 p-6 lg:p-8 flex flex-col overflow-y-auto gap-8 ${mobileTab === 'config' ? 'flex' : 'hidden lg:flex'}`}>
            <section>
              <h3 className="label-caps mb-4">Export Mode</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setFormat('html')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${format === 'html' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                >
                  <IconLayout className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Web View</span>
                </button>
                <button 
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${format === 'pdf' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                >
                  <IconFile className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Print / PDF</span>
                </button>
              </div>
            </section>

            <section>
              <h3 className="label-caps mb-4">Aesthetics</h3>
              <div className="space-y-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Typography</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      value={config.fontFamily}
                      onChange={e => updateConfig({ fontFamily: e.target.value as any })}
                    >
                       <option value="Inter">Modern Sans (Inter)</option>
                       <option value="Serif">Classic Serif</option>
                       <option value="Mono">Clean Monospace</option>
                    </select>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Layout Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['modern', 'classic', 'minimal'].map(t => (
                         <button 
                           key={t}
                           onClick={() => updateConfig({ theme: t as any })}
                           className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${config.theme === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </section>

            <section>
              <h3 className="label-caps mb-4">Structure</h3>
              <div className="space-y-2">
                 {[
                   { id: 'showCover', label: 'Cover Page' },
                   { id: 'showTOC', label: 'Milestones' },
                   { id: 'showAssets', label: 'Full Gallery' }
                 ].map(opt => (
                   <label key={opt.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer transition-all hover:border-blue-400">
                      <span className="text-[11px] font-black uppercase tracking-tight text-slate-600">{opt.label}</span>
                      <div className={`w-9 h-5 rounded-full p-1 transition-colors ${config[opt.id as keyof ExportConfig] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                         <div className={`bg-white w-3 h-3 rounded-full transition-transform ${config[opt.id as keyof ExportConfig] ? 'translate-x-4' : ''}`} />
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={config[opt.id as keyof ExportConfig] as boolean} 
                        onChange={e => updateConfig({ [opt.id]: e.target.checked })} 
                      />
                   </label>
                 ))}
              </div>
            </section>
          </div>

          {/* Preview Tab / Panel */}
          <div className={`flex-1 bg-slate-100 p-4 lg:p-10 flex flex-col items-center justify-center overflow-hidden relative ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full z-10 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Output Preview
            </div>
            
            <div className="w-full h-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden relative border border-slate-200">
               <iframe 
                 srcDoc={previewHtml} 
                 title="Export Preview"
                 className="w-full h-full border-0 bg-white"
                 sandbox="allow-same-origin"
               />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex flex-col lg:flex-row items-center justify-between gap-6 shrink-0 pb-safe">
          <div className="flex-1 max-w-md hidden lg:block">
            {isExporting ? (
              <div className="space-y-2">
                <div className="flex justify-between label-caps text-[9px]">
                   <span>{statusText}</span>
                   <span className="text-blue-600 font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                 <IconCheck className="w-3.5 h-3.5 text-emerald-500" /> All assets inlined for export
              </p>
            )}
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
             <Button variant="ghost" onClick={onClose} disabled={isExporting} className="flex-1 lg:flex-none rounded-full min-h-[50px]">Cancel</Button>
             <Button onClick={handleExport} disabled={isExporting} className="flex-[2] lg:flex-none bg-slate-900 text-white rounded-full shadow-fab min-h-[50px]">
               {isExporting ? 'Exporting...' : `Download ${format.toUpperCase()}`}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};