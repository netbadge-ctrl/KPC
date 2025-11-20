export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export enum AgentType {
  PLANNER = 'Planner',
  CODER = 'Coder',
  REFINER = 'Refiner',
  NONE = 'None'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  agent?: AgentType;
  timestamp: number;
  contentData?: PlanData | null; // For displaying structured data
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
  commitMessage?: string;
}