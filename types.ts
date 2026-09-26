export interface Asset {
  name: string;
  type: string;
  dataURL?: string; 
  url?: string;     
  storagePath?: string; 
  createdAt: string;
  size?: number; 
  stepId?: string;
  caption?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  showAssets: boolean;
}

export interface ExportConfig {
  theme: 'modern' | 'classic' | 'minimal';
  primaryColor: string;
  fontFamily: 'Inter' | 'Serif' | 'Mono';
  showCover: boolean;
  showTOC: boolean;
  showAssets: boolean;
  designerName: string;
  designerRole: string;
  excludedSteps: string[];
  sectionOrder?: string[]; 
  customOverrides?: Record<string, string>; 
  customSections?: CustomSection[]; // New: User created sections
}

export interface ProjectVersion {
  timestamp: string;
  notes: string;
  stepData?: Record<string, StepData>;
}

export interface StepData {
  notes: string;
  isComplete: boolean;
  userFlowNodes?: UserFlowNode[];
  uxLawsAudit?: Record<string, boolean>;
}

export interface UserFlowNode {
  id: string;
  type: 'entry' | 'screen' | 'action' | 'decision' | 'delight' | 'exit';
  title: string;
  description: string;
  notes?: string;
}

export interface UXLaw {
  id: string;
  name: string;
  subtitle: string;
  rule: string;
  summary: string;
  icon: string;
  category: 'Ergonomics' | 'Cognition' | 'Mental Models' | 'Delight';
  color: string;
  keyPractices: string[];
  auditChecklist: string[];
  formula?: string;
  templateSnippet: string;
}

export interface PerfectUserFlowPhase {
  id: string;
  phaseNumber: number;
  name: string;
  icon: string;
  description: string;
  uxLawConnection: string;
  questions: string[];
  checklist: string[];
  defaultTemplate: string;
}

export interface MacroPhase {
  id: string;
  name: string;
  shortName: string;
  description: string;
  stageIds: string[];
  icon: string;
  color: string;
}

export interface Project {
  id: string;
  title: string;
  desc: string;
  notes: string;
  stages: Record<string, boolean>;
  steps: Record<string, StepData>;
  expandedStages?: Record<string, boolean>; 
  assets: Asset[];
  history?: ProjectVersion[]; 
  createdAt: string;
  currentStepId?: string;
  exportConfig?: ExportConfig;
}

export interface AppState {
  projects: Record<string, Project>;
  activeProjectId: string | null;
}

export interface Template {
  key: string;
  label: string;
  desc?: string;
  content: string;
  category?: 'Research' | 'Design' | 'Testing' | 'Strategy' | 'Delivery';
  tags?: string[];
}
