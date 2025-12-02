
export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export enum AgentType {
  PLANNER = 'Planner',
  ARCHITECT = 'Architect', // New
  WORKER = 'Worker',       // New
  ASSEMBLER = 'Assembler', // New
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
  contentData?: PlanData | ArchitectPlan | null; // Updated to support ArchitectPlan
  relatedVersion?: number; // Links message to a specific artifact version
}

// Legacy Plan (Simple)
export interface PlanData {
  thought_process: string;
  component_list: string[];
  layout_strategy: string;
  implementation_steps: string[];
}

// New Hierarchical Plan
export interface ComponentSpec {
  name: string;
  description: string;
  props_contract: string; // e.g., "items: Array, isLoading: Boolean"
  emits_contract: string; // e.g., "update:query, delete-item"
}

export interface ArchitectPlan {
  thought_process: string;
  global_state_definition: string; // Description of the shared reactive state
  components: ComponentSpec[];
  main_logic_flow: string; // How components interact in the main App
}

export type AppState = 'idle' | 'planning' | 'architecting' | 'fabricating' | 'assembling' | 'coding' | 'refining' | 'ready';

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
  currentPlan: PlanData | ArchitectPlan | null;
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

export interface VectorDBConfig {
  enabled: boolean;
  endpoint: string; // e.g. https://api.your-cloud.com/v1/retrieve
  apiKey: string;
  collection: string; // Optional collection name
  topK: number;
}

export type SubmitShortcut = 'enter' | 'ctrl_enter';

export interface AppSettings {
  model: string;
  planningTemperature: number;
  codingTemperature: number;
  github: GitHubConfig;
  vectorDb: VectorDBConfig;
  submitShortcut: SubmitShortcut;
}