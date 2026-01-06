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