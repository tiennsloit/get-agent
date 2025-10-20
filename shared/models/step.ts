/**
 * Step execution types for Flow execution engine
 * Used by the extension to execute flow tasks
 */

/**
 * Types of execution steps
 */
export enum StepType {
  TEXT = 'text',
  COMMAND = 'command',
  FILE_ADD = 'file_add',
  FILE_EDIT = 'file_edit',
  FILE_REMOVE = 'file_remove'
}

/**
 * Base interface for all step data
 */
interface BaseStepData {
  type: StepType;
}

/**
 * Text step data (informational only)
 */
export interface TextStepData extends BaseStepData {
  type: StepType.TEXT;
  content: string;
}

/**
 * Command step data (terminal execution)
 */
export interface CommandStepData extends BaseStepData {
  type: StepType.COMMAND;
  command: string;
}

/**
 * File creation step data
 */
export interface FileAddStepData extends BaseStepData {
  type: StepType.FILE_ADD;
  path: string;
  content: string;
}

/**
 * File edit step data
 */
export interface FileEditStepData extends BaseStepData {
  type: StepType.FILE_EDIT;
  path: string;
  range: {
    start: number;
    end: number;
  };
  newContent: string;
}

/**
 * File removal step data
 */
export interface FileRemoveStepData extends BaseStepData {
  type: StepType.FILE_REMOVE;
  path: string;
}

/**
 * Union type for all step data types
 */
export type StepData = 
  | TextStepData
  | CommandStepData
  | FileAddStepData
  | FileEditStepData
  | FileRemoveStepData;

/**
 * Execution step interface
 */
export interface ExecutionStep {
  id: string;
  type: StepType;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  summary?: string;
  data: StepData;
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  success: boolean;
  summary: string;
  error?: string;
}
