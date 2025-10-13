/**
 * Flow types for the sidebar webview
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
 * Full Flow data for details view
 */
export interface Flow {
  id: string;
  title: string;
  description: string;
  state: FlowState;
  blueprint?: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    files: Array<{
      file: string;
      action: 'add' | 'edit' | 'remove';
    }>;
    contextFiles: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
  progress: FlowProgress;
  startTime: string;
  lastUpdated: string;
  executionReport?: ExecutionReport,
}

/**
 * Create flow request
 */
export interface CreateFlowRequest {
  title: string;
  description: string;
  currentFilePath?: string;
  currentFileContent?: string;
}
