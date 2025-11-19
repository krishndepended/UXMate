
export interface Asset {
  name: string;
  type: string;
  dataURL?: string; 
  url?: string;     
  storagePath?: string; 
  createdAt: string;
  size?: number; 
  stepId?: string; // Link asset to a specific process step
}

export interface ProjectVersion {
  timestamp: string;
  notes: string; // Legacy global notes
  stepData?: Record<string, StepData>; // New versioning
}

export interface StepData {
  notes: string;
  isComplete: boolean;
}

export interface Project {
  id: string;
  title: string;
  desc: string;
  notes: string; // Kept for legacy/general notes
  stages: Record<string, boolean>; // Kept for backward compat, but derived from stepData
  steps: Record<string, StepData>; // New: Per-step data
  expandedStages?: Record<string, boolean>; 
  assets: Asset[];
  history?: ProjectVersion[]; 
  createdAt: string;
  currentStepId?: string; // Tracks user's current location in the process
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

declare global {
  interface Window {
    FB: {
      app?: any;
      auth?: any;
      storage?: any;
      firestore?: any;
      doc?: any;
      db?: any;
      setDoc?: any;
      _initialized?: boolean;
    };
    initFirebaseIfNeeded: (config: any) => void;
    uploadFileToFirebase: (file: File) => Promise<string>;
    firebase: any;
    html2pdf: any;
  }
}
