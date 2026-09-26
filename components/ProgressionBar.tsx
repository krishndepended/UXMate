import React from 'react';
import { Project } from '../types';
import { STAGES, MACRO_PHASES } from '../constants';
import { IconCheck, IconArrowRight, IconDiamond } from './ui/Icons';

interface ProgressionBarProps {
  project: Project | null;
  currentStepId: string;
  onStepSelect: (stepId: string) => void;
  className?: string;
}

export const ProgressionBar: React.FC<ProgressionBarProps> = ({
  project,
  currentStepId,
  onStepSelect,
  className = ''
}) => {
  if (!project) return null;

  const currentStepIndex = STAGES.findIndex(s => s.id === currentStepId);
  const prevStep = STAGES[currentStepIndex - 1];
  const nextStep = STAGES[currentStepIndex + 1];

  const completedStepsCount = STAGES.filter(s => project.steps?.[s.id]?.isComplete).length;
  const progressPercent = Math.round((completedStepsCount / STAGES.length) * 100);

  return (
    <div className={`bg-white border-b border-slate-200 shadow-2xs select-none ${className}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Previous Step Quick Action */}
        <button
          onClick={() => prevStep && onStepSelect(prevStep.id)}
          disabled={!prevStep}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0 active:scale-95"
          title={prevStep ? `Go back to: ${prevStep.label}` : 'First step'}
        >
          <IconArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span className="truncate max-w-[100px]">Prev</span>
        </button>

        {/* Double Diamond Macro-Phases Progression Track */}
        <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto hide-scrollbar py-0.5">
          {MACRO_PHASES.map((phase, phaseIdx) => {
            const phaseStages = STAGES.filter(s => phase.stageIds.includes(s.id));
            const completedInPhase = phaseStages.filter(s => project.steps?.[s.id]?.isComplete).length;
            const isPhaseComplete = completedInPhase === phaseStages.length;
            const isPhaseActive = phase.stageIds.includes(currentStepId);

            return (
              <div 
                key={phase.id} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                  isPhaseActive 
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950 shadow-2xs' 
                    : isPhaseComplete
                    ? 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                    : 'bg-slate-50/60 border-slate-200/80 text-slate-600'
                }`}
              >
                {/* Phase Identity */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs">{phase.icon}</span>
                  <span className="text-xs font-bold tracking-tight">
                    {phase.shortName}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    isPhaseActive 
                      ? 'bg-blue-600 text-white' 
                      : isPhaseComplete 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {completedInPhase}/{phaseStages.length}
                  </span>
                </div>

                {/* Step Indicator Nodes */}
                <div className="flex items-center gap-1.5 ml-1">
                  {phaseStages.map((stage) => {
                    const isDone = project.steps?.[stage.id]?.isComplete;
                    const isActive = currentStepId === stage.id;
                    const globalIdx = STAGES.findIndex(s => s.id === stage.id);

                    return (
                      <button
                        key={stage.id}
                        onClick={() => onStepSelect(stage.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all relative group cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/40 ring-offset-1 shadow-xs scale-105'
                            : isDone
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'
                        }`}
                        title={`${stage.label} ${isDone ? '(Completed)' : ''}`}
                      >
                        {isDone && !isActive ? (
                          <IconCheck className="w-3 h-3 stroke-[3]" />
                        ) : (
                          globalIdx + 1
                        )}

                        {/* Hover Tooltip */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none z-50 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium py-1 px-2 rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-150">
                          {stage.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Connecting arrow between phases */}
                {phaseIdx < MACRO_PHASES.length - 1 && (
                  <div className="hidden xl:block text-slate-300 ml-1">
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Step Quick Action & Global Progress */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="font-mono font-bold text-slate-800">{progressPercent}%</span>
            <span>done</span>
          </div>

          <button
            onClick={() => nextStep && onStepSelect(nextStep.id)}
            disabled={!nextStep}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-2xs"
            title={nextStep ? `Proceed to: ${nextStep.label}` : 'At final case study'}
          >
            <span>{nextStep ? 'Next' : 'Review'}</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
