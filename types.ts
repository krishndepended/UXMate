
export interface Asset {
  name: string;
  type: string;
  dataURL?: string; // Optional now, used for local small files
  url?: string;     // New: used for remote Firebase files
  storagePath?: string; // New: path in storage for reference
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  desc: string;
  notes: string;
  stages: Record<string, boolean>;
  assets: Asset[];
  createdAt: string;
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
