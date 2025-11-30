
export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export enum AgentType {
  PLANNER = 'Planner',
  CODER = 'Coder',
  REFINER = 'Refiner',
  FIXER = 'AutoFixer',
  FORGER = 'Forger'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  image?: string; // Base64 encoded image string
  agent?: AgentType;
  timestamp: number;
  contentData?: PlanData | null; // For displaying structured data
  relatedVersion?: number; // Links message to a specific artifact version
}

export interface PlanData {
  thought_process: string;
  component_list: string[];
  layout_strategy: string;
  implementation_steps: string[];
}

export type AppState = 'idle' | 'planning' | 'coding' | 'refining' | 'ready';

export interface GeneratedArtifact {
  code: string;
  language: string;
  version: number;
  timestamp: number;
  commitMessage?: string;
}

export interface Page {
  id: string;
  name: string;
  messages: Message[];
  appState: AppState;
  currentPlan: PlanData | null;
  generatedArtifact: GeneratedArtifact; // The currently active/viewed artifact
  history: GeneratedArtifact[]; // All saved versions
}

export interface User {
  id: string;
  name: string;
  avatar: string; // URL or emoji char
  role: string;
  themeColor: string; // For UI personalization
}

export interface Project {
  id: string;
  ownerId: string; // Links project to a user
  name: string;
  pages: Page[];
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export type SubmitShortcut = 'enter' | 'ctrl_enter';

export interface AppSettings {
  model: string;
  planningTemperature: number;
  codingTemperature: number;
  github: GitHubConfig;
  submitShortcut: SubmitShortcut;
}
