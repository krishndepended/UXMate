import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { IconClose, IconPlus, IconCheck } from './ui/Icons';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, desc: string, starterNotes?: string) => void;
}

interface ProductPreset {
  id: string;
  title: string;
  desc: string;
  category: string;
  icon: string;
  starterProblem: string;
}

const PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: 'ecommerce_checkout',
    title: 'Mobile Checkout Redesign',
    desc: 'Streamlining cart-to-purchase flow to reduce 35% cart abandonment',
    category: 'E-Commerce',
    icon: '🛒',
    starterProblem: `### Problem Framing: Mobile Checkout Friction

**Core Problem:** 
Mobile shoppers on our platform abandon their carts at a rate of 68% between the cart review and final payment step. Users express frustration over repetitive address inputs, unexpected shipping fees at the final step, and lack of biometric one-click payment options.

**Target Audience:**
- Frequent mobile shoppers aged 22–45 making repeat weekly purchases.
- First-time guests needing fast checkout without mandatory account creation.

**Business Objectives & KPIs:**
- Reduce checkout abandonment by at least 25% within 90 days of launch.
- Decrease average checkout completion time from 145 seconds to under 45 seconds.
- Increase adoption of 1-click Express Pay (Apple Pay / Google Pay) to 40% of transactions.`
  },
  {
    id: 'saas_analytics',
    title: 'B2B Analytics Dashboard',
    desc: 'Modernizing workspace data visualization and role-based access',
    category: 'Enterprise SaaS',
    icon: '📊',
    starterProblem: `### Problem Framing: Workspace Data Discovery

**Core Problem:** 
Enterprise team leads spend upwards of 20 minutes compiling weekly performance metrics because data is fragmented across 4 disconnected reporting tables with dense unformatted grids.

**Target Audience:**
- Product Managers and Operations Directors managing 5–50 team members.
- Executive stakeholders requiring high-level monthly KPI summaries.

**Business Objectives & KPIs:**
- Cut weekly report generation time from 20 minutes down to under 3 minutes.
- Achieve 80%+ positive usability score (SUS) in post-release cohort testing.
- Increase daily active dashboard engagement among team leads by 30%.`
  },
  {
    id: 'fintech_wallet',
    title: 'Fintech Instant Transfer',
    desc: 'Redesigning peer-to-peer payments and biometric authentication',
    category: 'Fintech',
    icon: '💳',
    starterProblem: `### Problem Framing: Instant Transfer Confidence & Safety

**Core Problem:** 
Users feel anxious during high-value money transfers due to ambiguous recipient verification screens and delayed confirmation feedback, causing frequent cancellation and customer support tickets.

**Target Audience:**
- Gen Z and Millennial mobile banking users making regular P2P split payments.
- Freelancers and gig economy workers receiving instant customer payouts.

**Business Objectives & KPIs:**
- Eliminate recipient misdirection errors to under 0.05% of all transfers.
- Cut transfer-related customer support tickets by 50%.
- Maintain 99.9% user confidence rating on biometric authentication screens.`
  },
  {
    id: 'telehealth_booking',
    title: 'Telehealth Care Portal',
    desc: 'Patient appointment scheduling and secure prescription management',
    category: 'Healthcare',
    icon: '🩺',
    starterProblem: `### Problem Framing: Patient Appointment Friction

**Core Problem:** 
Patients requiring specialist consultations face long 7-step booking questionnaires that result in a 42% drop-off before physician matching.

**Target Audience:**
- Patients seeking remote primary care and urgent consultations.
- Elderly and accessibility-reliant users who need clear, high-contrast layouts.

**Business Objectives & KPIs:**
- Streamline specialist matching to 3 intuitive steps.
- Increase appointment completion rate from 58% to 85%.
- Comply fully with WCAG AAA accessibility and HIPAA privacy standards.`
  }
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [starterNotes, setStarterNotes] = useState<string>('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDesc('');
      setSelectedPresetId(null);
      setStarterNotes('');
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ProductPreset) => {
    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null);
      setTitle('');
      setDesc('');
      setStarterNotes('');
    } else {
      setSelectedPresetId(preset.id);
      setTitle(preset.title);
      setDesc(preset.desc);
      setStarterNotes(preset.starterProblem);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim(), desc.trim(), starterNotes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Create Product Design Project</h2>
            <p className="text-xs text-slate-500 mt-0.5">Start fresh or select an industry-standard product workflow</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto space-y-5 pr-1 hide-scrollbar">
          {/* Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Product Starter Templates (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRODUCT_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{preset.icon}</span>
                        <span className="text-xs font-bold text-slate-900 leading-snug">{preset.title}</span>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <IconCheck className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Product Name / Title <span className="text-red-500">*</span>
            </label>
            <input 
              ref={titleRef}
              type="text" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400" 
              placeholder="e.g. Grocery Delivery App Checkout" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Core Goal / Brief
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400" 
              placeholder="e.g. Redesigning 1-click cart and express checkout for mobile" 
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 shrink-0 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 hover:text-slate-900">
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm">
              <IconPlus className="w-3.5 h-3.5 mr-1.5" /> Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
