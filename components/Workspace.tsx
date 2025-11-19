
// REMOVED_AI: removed AI integration - local only
import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { STAGES } from '../constants';
import { Button } from './ui/Button';
import { IconDownload, IconTrash, IconFile, IconEdit, IconEye, IconReplace } from './ui/Icons';
import { ProgressRing } from './ui/ProgressRing';
import { downloadCaseStudy, exportCaseToPDF } from '../utils/exporter';
import { AssetCard } from './ui/AssetCard';
import { ContextMenu } from './ui/ContextMenu';

interface WorkspaceProps {
  project: Project | null;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProjectNotes: (notes: string) => void;
  deleteAsset: (index: number) => void;
  onReplaceAsset: (index: number, file: File) => void;
  openTemplates: () => void;
  clearProjectData: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  updateProject,
  updateProjectNotes,
  deleteAsset,
  onReplaceAsset,
  openTemplates,
  clearProjectData
}) => {
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Inline Editing States
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescVal, setEditDescVal] = useState('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    assetIndex: number;
  } | null>(null);

  // Replace Asset State
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  useEffect(() => {
    setNotes(project?.notes || '');
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    if (notes === project.notes) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      updateProjectNotes(notes);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, project, updateProjectNotes]);

  // Handlers for Inline Edit
  const startEditTitle = () => {
    if (!project) return;
    setEditTitleVal(project.title);
    setIsEditingTitle(true);
  };
  
  const saveTitle = () => {
    if (!project) return;
    if (editTitleVal.trim() && editTitleVal !== project.title) {
      updateProject(project.id, { title: editTitleVal });
    }
    setIsEditingTitle(false);
  };

  const startEditDesc = () => {
    if (!project) return;
    setEditDescVal(project.desc);
    setIsEditingDesc(true);
  };
  
  const saveDesc = () => {
    if (!project) return;
    if (editDescVal !== project.desc) {
      updateProject(project.id, { desc: editDescVal });
    }
    setIsEditingDesc(false);
  };

  // Asset Interaction Handlers
  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      assetIndex: index
    });
  };

  const handleReplaceClick = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  const onReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && replaceIndex !== null) {
      onReplaceAsset(replaceIndex, e.target.files[0]);
      setReplaceIndex(null);
      e.target.value = ''; // Reset
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-white/5 rounded-xl p-10 text-center shadow-lg min-h-[500px]" role="main">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-muted">
          <IconFile className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Project Selected</h2>
        <p className="text-muted max-w-md">Create a new project or select one from the sidebar to start working on your case study.</p>
      </div>
    );
  }

  const completedStages = Object.values(project.stages).filter(Boolean).length;
  const progress = Math.round((completedStages / STAGES.length) * 100);

  return (
    <main className="flex-1 flex flex-col gap-6 min-w-0" role="main">
      {/* Header Card */}
      <div className="bg-surface border border-white/5 rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 min-w-0 flex items-center gap-4">
          {/* Progress Ring */}
          <div aria-label={`Project progress: ${progress}%`}>
             <ProgressRing progress={progress} radius={24} stroke={4} className="flex-shrink-0" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 group">
              {isEditingTitle ? (
                <input 
                  autoFocus
                  type="text"
                  className="text-2xl font-bold text-white bg-black/20 border border-accent rounded px-2 py-0.5 w-full outline-none"
                  value={editTitleVal}
                  onChange={e => setEditTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => e.key === 'Enter' && saveTitle()}
                  aria-label="Edit Project Title"
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-white truncate cursor-pointer hover:text-accent transition-colors border border-transparent hover:border-white/5 rounded px-1 -ml-1"
                  onDoubleClick={startEditTitle}
                  title="Double click to edit title"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && startEditTitle()}
                >
                  {project.title}
                </h1>
              )}
              {!isEditingTitle && (
                 <button onClick={startEditTitle} className="opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1" aria-label="Edit title">
                   <IconEdit className="w-4 h-4" aria-hidden="true" />
                 </button>
              )}
            </div>

            <div className="mt-1 group flex items-center gap-2">
               {isEditingDesc ? (
                 <input 
                  autoFocus
                  type="text"
                  className="text-sm text-muted bg-black/20 border border-accent rounded px-2 py-0.5 w-full max-w-md outline-none"
                  value={editDescVal}
                  onChange={e => setEditDescVal(e.target.value)}
                  onBlur={saveDesc}
                  onKeyDown={e => e.key === 'Enter' && saveDesc()}
                  aria-label="Edit Project Description"
                 />
               ) : (
                 <p 
                   className="text-muted text-sm cursor-pointer hover:text-white transition-colors border border-transparent hover:border-white/5 rounded px-1 -ml-1 truncate"
                   onDoubleClick={startEditDesc}
                   title="Double click to edit description"
                   tabIndex={0}
                   onKeyDown={e => e.key === 'Enter' && startEditDesc()}
                 >
                   {project.desc || 'No description provided.'}
                 </p>
               )}
               {!isEditingDesc && (
                 <button onClick={startEditDesc} className="opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1" aria-label="Edit description">
                   <IconEdit className="w-3.5 h-3.5" aria-hidden="true" />
                 </button>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Button id="tour-templates" variant="ghost" onClick={openTemplates} aria-label="Open templates library">Templates</Button>
          <Button 
            className="bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/10"
            onClick={() => exportCaseToPDF(project)}
            aria-label="Export project as PDF"
          >
            Export PDF
          </Button>
          <Button 
            id="tour-export"
            className="bg-gradient-to-r from-success to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-surface font-bold shadow-lg shadow-emerald-900/20 border-0"
            onClick={() => downloadCaseStudy(project)}
            aria-label="Export project as HTML Case Study"
          >
            <IconDownload className="w-4 h-4" aria-hidden="true" /> Export HTML
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Editor & Tools */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Notes Editor */}
          <div className="bg-surface border border-white/5 rounded-xl p-1 shadow-lg flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <label htmlFor="notes" className="text-sm font-semibold text-muted uppercase tracking-wide">Project Notes & Documentation</label>
              <div className={`text-xs transition-colors ${saveStatus === 'saved' ? 'text-success' : 'text-muted'}`} role="status">{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Auto-save active'}</div>
            </div>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Start typing your problem statement, research notes, or findings here..."
              className="w-full flex-1 bg-transparent p-6 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset text-gray-300 leading-relaxed min-h-[400px]"
              aria-label="Project notes"
            />
            <div className="px-4 py-3 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
              <Button variant="danger" size="sm" onClick={clearProjectData} aria-label="Clear all project data">Clear Data</Button>
            </div>
          </div>
        </div>

        {/* Right: Progress & Assets */}
        <div className="flex flex-col gap-6 min-w-0">
          
          {/* Progress Card */}
          <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-white">Progress</h3>
               <span className="text-xs font-mono text-accent">{progress}%</span>
             </div>
             <div className="h-2 bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Project completion progress">
               <div 
                 className="h-full bg-gradient-to-r from-accent to-blue-400 transition-all duration-500"
                 style={{ width: `${progress}%` }}
               />
             </div>
             <div className="mt-2 text-xs text-muted text-right">{completedStages} of {STAGES.length} stages completed</div>
          </div>

          {/* Assets List */}
          <div className="bg-surface border border-white/5 rounded-xl p-5 shadow-lg flex-1 flex flex-col min-h-[300px]">
            <h3 className="font-bold text-white mb-4">Project Assets</h3>
            
            {project.assets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted text-center border border-dashed border-white/10 rounded-lg">
                No assets uploaded yet.
              </div>
            ) : (
              // Responsive Grid: Carousel (flex) on mobile, Grid on desktop
              <div className="flex-1 relative min-w-0">
                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
                   {/* Mobile: Swipeable Row, Desktop: Grid */}
                   <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 lg:grid lg:grid-cols-2 xl:grid-cols-2 lg:overflow-visible lg:pb-0 scrollbar-hide" role="list" aria-label="Uploaded assets">
                     {[...project.assets].reverse().map((asset, index) => {
                       const originalIndex = project.assets.length - 1 - index;
                       return (
                         <div role="listitem" key={index}>
                           <AssetCard 
                             asset={asset}
                             onClick={() => {
                               const url = asset.url || asset.dataURL;
                               if(url) window.open(url, '_blank');
                             }}
                             onContextMenu={(e) => handleContextMenu(e, originalIndex)}
                             onMoreClick={(e) => handleContextMenu(e, originalIndex)}
                           />
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden File Input for Replacement */}
      <input 
        type="file"
        ref={replaceInputRef}
        className="hidden"
        accept="image/*,.pdf"
        onChange={onReplaceFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Context Menu */}
      <ContextMenu 
        isOpen={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        items={[
          {
            label: 'Open / Download',
            icon: <IconDownload className="w-4 h-4" />,
            onClick: () => {
               if(contextMenu && project.assets[contextMenu.assetIndex]) {
                 const a = project.assets[contextMenu.assetIndex];
                 const url = a.url || a.dataURL;
                 if(url) {
                   const link = document.createElement('a');
                   link.href = url;
                   link.download = a.name;
                   link.target = '_blank';
                   link.click();
                 }
               }
            }
          },
          {
            label: 'Replace Asset',
            icon: <IconReplace className="w-4 h-4" />,
            onClick: () => {
              if (contextMenu) handleReplaceClick(contextMenu.assetIndex);
            }
          },
          {
            label: 'Delete Asset',
            icon: <IconTrash className="w-4 h-4" />,
            danger: true,
            onClick: () => {
              if (contextMenu) deleteAsset(contextMenu.assetIndex);
            }
          }
        ]}
      />
    </main>
  );
};