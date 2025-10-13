/**
 * API types for Flow feature
 */

import type { RelatedFile } from '../../../core/types/api/getRelatedFiles';

/**
 * Request to generate a blueprint for a flow
 */
export interface FlowBlueprintRequest {
  taskDescription: string;
  currentFilePath: string;
  currentFileContent: string;
  projectStructure: string[];
  relatedFiles: RelatedFile[];
}

/**
 * Response containing generated blueprint
 */
export interface FlowBlueprintResponse {
  title: string;
  description: string;
  blueprint: string;        // Markdown formatted blueprint
  tasks: Array<{
    title: string;
    description: string;
    files: Array<{
      file: string;
      action: 'add' | 'edit' | 'remove';
    }>;
    contextFiles: string[];
  }>;
  estimatedTasks: number;
}

/**
 * Request to generate subtasks for a flow task
 */
export interface FlowSubtasksRequest {
  currentFilePath: string;
  currentFileContent: string;
  projectStructure: string[];
  relatedFiles: RelatedFile[];
  outlineTasks: Array<{
    title: string;
    description: string;
    files: Array<{
      file: string;
      action: 'add' | 'edit' | 'remove';
    }>;
    contextFiles: string[];
  }>;
  currentTask: {
    title: string;
    description: string;
    files: Array<{
      file: string;
      action: 'add' | 'edit' | 'remove';
    }>;
    contextFiles: string[];
  };
}

/**
 * Response containing generated subtasks
 */
export interface FlowSubtasksResponse {
  subtasks: Array<{
    id: number;
    type: string;
    title: string;
    body: string;
    action: {
      type: string;
      syntax: string;
      target: string;
      range?: [number, number];
      value: string;
    };
    outcome: string;
    visualHint: string;
    autoAdvance: boolean;
  }>;
}