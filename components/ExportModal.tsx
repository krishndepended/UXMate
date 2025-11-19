
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { generateFullHtml, downloadCaseStudy, exportCaseToPDF } from '../utils/exporter';
import { Button } from './ui/Button';
import { IconClose, IconDownload, IconFile, IconCheck } from './ui/Icons';

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

  // Generate preview when settings change
  useEffect(() => {
    if (project && isOpen) {
      const html = generateFullHtml(project, includeAssets);
      setPreviewHtml(html);
      
      // Calculate size estimate
      const sizeBytes = new Blob([html]).size;
      const kb = Math.round(sizeBytes / 1024);
      
      if (format === 'html') {
        setEstimatedSize(`~${kb} KB (HTML File)`);
      } else {
        // Rough estimate for PDF: HTML size * factor + base overhead
        const pdfEst = Math.round(kb * 1.5 + 500); 
        setEstimatedSize(`~${pdfEst} KB (PDF Document)`);
      }
    }
  }, [project, isOpen, format, includeAssets]);

  if (!isOpen || !project) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setStatusText('Starting export...');

    try {
      if (format === 'html') {
        setStatusText('Preparing HTML...');
        setProgress(50);
        await new Promise(r => setTimeout(r, 500)); // Fake delay for UX
        downloadCaseStudy(project, includeAssets);
        setProgress(100);
        setStatusText('Download started!');
      } else {
        await exportCaseToPDF(project, includeAssets, (status, pct) => {
          setStatusText(status);
          setProgress(pct);
        });
      }
      
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setStatusText('Export failed. Check console.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-white/10 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-surface">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <IconDownload className="w-5 h-5 text-accent" /> Export Case Study
            </h2>
            <p className="text-xs text-muted">Generate a portfolio-ready file of {project.title}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Controls */}
          <div className="w-72 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-8">
            
            {/* Format Selection */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Format</h3>
              <div className="space-y-2">
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${format === 'html' ? 'bg-accent/10 border-accent text-white' : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}`}>
                  <input 
                    type="radio" 
                    name="format" 
                    className="sr-only"
                    checked={format === 'html'} 
                    onChange={() => setFormat('html')}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">HTML Webpage</div>
                    <div className="text-[10px] opacity-70">Interactive, best for sharing</div>
                  </div>
                  {format === 'html' && <IconCheck className="w-4 h-4 text-accent" />}
                </label>

                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${format === 'pdf' ? 'bg-accent/10 border-accent text-white' : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}`}>
                  <input 
                    type="radio" 
                    name="format" 
                    className="sr-only"
                    checked={format === 'pdf'} 
                    onChange={() => setFormat('pdf')}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">PDF Document</div>
                    <div className="text-[10px] opacity-70">Printable, A4 Layout</div>
                  </div>
                  {format === 'pdf' && <IconCheck className="w-4 h-4 text-accent" />}
                </label>
              </div>
            </div>

            {/* Options */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Options</h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeAssets ? 'bg-accent border-accent' : 'border-white/30 bg-transparent'}`}>
                  {includeAssets && <IconCheck className="w-3.5 h-3.5 text-surface" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={includeAssets} 
                  onChange={e => setIncludeAssets(e.target.checked)} 
                />
                <span className="text-sm text-gray-300 group-hover:text-white">Include Assets (Images)</span>
              </label>
              <p className="text-xs text-muted mt-2 ml-8 leading-relaxed">
                {includeAssets ? 'Images will be embedded in the file.' : 'Images will be replaced with file names to reduce size.'}
              </p>
            </div>

            {/* Summary */}
            <div className="mt-auto bg-white/5 rounded-lg p-4 border border-white/5">
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Estimated Size</div>
              <div className="text-lg font-mono text-accent">{estimatedSize}</div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-[#525659] flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md z-10">
              Preview
            </div>
            <div className="w-full h-full max-w-[800px] bg-white shadow-2xl rounded overflow-hidden relative">
               {/* Iframe overlay to block interaction if needed, but scrolling is good */}
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
        <div className="p-5 border-t border-white/5 bg-surface flex items-center justify-between">
          <div className="flex-1 max-w-md mr-4">
            {isExporting && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white font-medium">
                   <span>{statusText}</span>
                   <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
             <Button variant="ghost" onClick={onClose} disabled={isExporting}>Cancel</Button>
             <Button onClick={handleExport} disabled={isExporting} className="min-w-[140px]">
               {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
