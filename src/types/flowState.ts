/**
 * Flow state definitions for the Flow feature
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
 * Task file operation types
 */
export interface TaskFile {
  file: string;
  action: 'add' | 'edit' | 'remove';
}

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
 * Progress tracking for flows
 */
export interface FlowProgress {
  done: number;
  total: number;
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
}

/**
 * Flow creation request
 */
export interface CreateFlowRequest {
  title: string;
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
