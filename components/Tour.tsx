
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Button } from './ui/Button';
import { IconClose } from './ui/Icons';

const STEPS = [
  {
    targetId: 'tour-create',
    title: 'Create Projects',
    content: 'Start by creating a new project for your case study here.',
  },
  {
    targetId: 'tour-stages',
    title: 'Track Progress',
    content: 'Follow the 12-step UX process checklist. Expand items for tips.',
  },
  {
    targetId: 'tour-upload',
    title: 'Manage Assets',
    content: 'Upload sketches, screenshots, and diagrams here. They will be included in your export.',
  },
  {
    targetId: 'tour-templates',
    title: 'Use Templates',
    content: 'Insert professional templates like Personas and Research Scripts directly into your notes.',
  },
  {
    targetId: 'tour-export',
    title: 'Export Case Study',
    content: 'When finished, download your work as a portfolio-ready HTML page or PDF.',
  },
];

const TOUR_KEY = 'uxmate_tour_completed_v1';

export const Tour: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; align: 'left' | 'right' | 'center' } | null>(null);

  useEffect(() => {
    const isDone = localStorage.getItem(TOUR_KEY);
    if (!isDone) {
      // Wait a moment for initial render
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStep = STEPS[stepIndex];

  const updatePosition = () => {
    if (!isActive) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const isLeftHalf = rect.left < window.innerWidth / 2;
      const isTopHalf = rect.top < window.innerHeight / 2;
      
      // Simple positioning logic
      // On mobile, fallback to fixed center bottom?
      // For now, let's try to position floating near element
      
      let top = rect.bottom + 10;
      let left = rect.left;
      let align: 'left' | 'right' | 'center' = 'left';

      if (!isLeftHalf) {
        left = rect.right - 300; // Approx width
        align = 'right';
        if (left < 10) left = 10;
      }

      // If element is near bottom, show above
      if (!isTopHalf && rect.bottom > window.innerHeight - 150) {
        top = rect.top - 180; // Move above
      }
      
      // Mobile override: always center bottom
      if (window.innerWidth < 768) {
        setCoords({ top: window.innerHeight - 220, left: 10, align: 'center' });
      } else {
        setCoords({ top, left, align });
      }
    } else {
      // Element not found (maybe hidden), skip step or show centered?
      // Let's just show centered fallback
      setCoords({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160, align: 'center' });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [stepIndex, isActive]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const handleSkip = () => {
    finishTour();
  };

  const finishTour = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setIsActive(false);
  };

  if (!isActive || !coords) return null;

  const isLast = stepIndex === STEPS.length - 1;
  const widthClass = window.innerWidth < 768 ? 'w-[calc(100%-20px)]' : 'w-80';

  return (
    <>
      {/* Overlay / Spotlight effect (optional, simple dim) */}
      <div className="fixed inset-0 bg-black/20 z-[90] pointer-events-none" />

      {/* Tooltip Card */}
      <div 
        className={`fixed z-[100] bg-surface border border-accent/50 shadow-2xl rounded-xl p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 ${widthClass}`}
        style={{ 
          top: coords.top, 
          left: coords.left,
        }}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-white text-lg">{currentStep.title}</h3>
          <button onClick={handleSkip} className="text-muted hover:text-white">
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-300 leading-relaxed">
          {currentStep.content}
        </p>

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
          <div className="text-xs text-muted">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>Skip</Button>
            <Button variant="primary" size="sm" onClick={handleNext}>
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
        
        {/* Arrow (Decorative) - rough placement */}
        <div className={`absolute w-4 h-4 bg-surface border-t border-l border-accent/50 transform rotate-45 -top-2 ${coords.align === 'right' ? 'right-6' : 'left-6'} ${coords.align === 'center' ? 'hidden' : ''}`} />
      </div>
    </>
  );
};
