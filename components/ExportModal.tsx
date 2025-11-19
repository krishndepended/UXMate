import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { generateFullHtml, downloadCaseStudy, exportToPrintable } from '../utils/exporter';
import { Button } from './ui/Button';
import { IconClose, IconDownload, IconFile, IconCheck, IconLayout } from './ui/Icons';

interface ExportModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, isOpen, onClose }) => {
  const [format, setFormat] = useState<'html' | 'pdf'>('html');
  const [includeAssets, setIncludeAssets] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [estimatedSize, setEstimatedSize] = useState<string>('Calculating...');
  
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (project && isOpen) {
      const html = generateFullHtml(project, includeAssets);
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
  }, [project, isOpen, format, includeAssets]);

  if (!isOpen || !project) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    
    try {
      if (format === 'html') {
        setStatusText('Preparing HTML...');
        setProgress(50);
        await new Promise(r => setTimeout(r, 500)); 
        downloadCaseStudy(project, includeAssets);
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
        
        const result = await exportToPrintable(project, includeAssets);
        
        setProgress(100);
        if (result.method === 'print') {
          setStatusText('Print dialog opened!');
        } else {
          setStatusText('Popup blocked: HTML downloaded.');
          alert("Your browser blocked the Print window. We've downloaded the file instead. Open it and choose 'Print -> Save as PDF'.");
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <IconDownload className="w-5 h-5 text-blue-600" /> Export Case Study
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Generate a portfolio-ready file of "{project.title}"</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Controls */}
          <div className="w-full md:w-80 bg-slate-50/50 border-r border-slate-100 p-6 flex flex-col overflow-y-auto">
            
            {/* Format Selection */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Export Format</h3>
              <div className="space-y-3">
                <label className={`relative flex items-start p-4 rounded-xl border cursor-pointer transition-all ${format === 'html' ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="radio" 
                    name="format" 
                    className="sr-only"
                    checked={format === 'html'} 
                    onChange={() => setFormat('html')}
                  />
                  <div className="mt-1 mr-3 text-slate-400">
                     <IconLayout className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${format === 'html' ? 'text-blue-700' : 'text-slate-700'}`}>HTML Webpage</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-tight">Interactive single file, best for sharing online.</div>
                  </div>
                  {format === 'html' && <div className="absolute top-4 right-4"><IconCheck className="w-4 h-4 text-blue-600" /></div>}
                </label>

                <label className={`relative flex items-start p-4 rounded-xl border cursor-pointer transition-all ${format === 'pdf' ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="radio" 
                    name="format" 
                    className="sr-only"
                    checked={format === 'pdf'} 
                    onChange={() => setFormat('pdf')}
                  />
                   <div className="mt-1 mr-3 text-slate-400">
                     <IconFile className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${format === 'pdf' ? 'text-blue-700' : 'text-slate-700'}`}>Print / PDF</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-tight">Formatted document. Opens system print dialog.</div>
                  </div>
                  {format === 'pdf' && <div className="absolute top-4 right-4"><IconCheck className="w-4 h-4 text-blue-600" /></div>}
                </label>
              </div>
            </div>

            <hr className="border-slate-200 mb-6" />

            {/* Options */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Options</h3>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${includeAssets ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                  {includeAssets && <IconCheck className="w-3.5 h-3.5 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={includeAssets} 
                  onChange={e => setIncludeAssets(e.target.checked)} 
                />
                <div>
                   <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Include Assets</span>
                   <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Embed images directly into the file. Increases file size but ensures portability.
                  </p>
                </div>
              </label>
            </div>

            {/* Summary */}
            <div className="mt-auto bg-blue-50/50 rounded-lg p-4 border border-blue-100">
              <div className="text-[10px] text-blue-400 uppercase tracking-wider font-bold mb-1">Estimated Size</div>
              <div className="text-lg font-mono text-blue-700 font-bold">{estimatedSize}</div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-slate-100 hidden md:flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md z-10 shadow-lg">
              Live Preview
            </div>
            <div className="w-full h-full max-w-[800px] bg-white shadow-2xl ring-1 ring-slate-900/5 rounded-lg overflow-hidden relative transition-transform hover:scale-[1.01] duration-500">
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
        <div className="p-5 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="w-full md:flex-1 md:max-w-md md:mr-4">
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                   <span>{statusText}</span>
                   <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <Button variant="ghost" onClick={onClose} disabled={isExporting} className="w-full md:w-auto justify-center">Cancel</Button>
             <Button onClick={handleExport} disabled={isExporting} className="w-full md:w-auto min-w-[160px] justify-center shadow-lg shadow-blue-500/20">
               {isExporting ? 'Working...' : `Download ${format === 'html' ? 'HTML' : 'PDF'}`}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};