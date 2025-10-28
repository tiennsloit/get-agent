/**
 * Flow domain models
 * Shared across extension, webviews, and serverless functions
 */

/**
 * Possible states for a Flow
 */
export enum FlowState {
  TODO = 'to-do',
  DESIGNING = 'designing',
  EXECUTING = 'executing',
  REPORTING = 'reporting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

/**
 * Progress tracking for flows
 */
export interface FlowProgress {
  done: number;
  total: number;
}

/**
 * Task file operation types
 */
export interface TaskFile {
  file: string;
  action: 'add' | 'edit' | 'remove';
}

/**
 * TODO item types for execution workflow
 */
export type TaskItem = {
  type: 'task';
  content: string;
};

export type PhaseItem = {
  type: 'phase';
  name: string;
  tasks: string[];
};

export type TodoItem = TaskItem | PhaseItem;

export type TodoState = 'todo' | 'doing' | 'done';

/**
 * High-level task within a flow
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  files: TaskFile[];
  contextFiles: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

/**
 * Execution report for completed flows
 */
export interface ExecutionReport {
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  commandsExecuted: string[];
  status: 'completed' | 'failed' | 'cancelled';
  summary: string;
  errors?: string[];
}

/**
 * Chat message for design exploration
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | any;
  type?: 'analysis' | 'log' | 'thought' | 'loading';
  id?: string;
  metadata?: any;
}

/**
 * Design data for flow detail persistence
 */
export interface FlowDesignData {
  blueprint?: string;
  messages?: ChatMessage[];
  analysisContext?: any;
  explorationHistory?: any[]; // ExplorationHistory from flowAnalysisTypes
  cumulativeKnowledge?: any; // CumulativeKnowledge from flowAnalysisTypes
  explorerContext?: any; // ExplorerContext from designStore
}

/**
 * Execution data for flow detail persistence
 */
export interface FlowExecutionData {
  todoList?: TodoItem[];
  currentTodoIndex?: number;
  agentSteps?: any[]; // AgentStep from execution
}

/**
 * Main Flow interface
 */
export interface Flow {
  id: string;
  title: string;
  description?: string;
  state: FlowState;
  blueprint?: string;
  tasks: Task[];
  progress: FlowProgress;
  startTime: string;
  lastUpdated: string;
  executionReport?: ExecutionReport;
  designData?: FlowDesignData;
  executionData?: FlowExecutionData;
}

/**
 * Flow list item for sidebar display
 */
export interface FlowListItem {
  id: string;
  title: string;
  state: FlowState;
  progress: FlowProgress;
  lastUpdated: string;
}

/**
 * Flow creation request
 */
export interface CreateFlowRequest {
  title: string;
  description?: string;
  currentFilePath?: string;
  currentFileContent?: string;
}

