/**
 * API contract models for backend communication
 * Shared across extension and serverless functions
 */

/**
 * Project file structure for API requests
 */
export interface ProjectFile {
  path: string;
  language: string;
}

/**
 * Related file metadata with relevance score
 */
export interface RelatedFile {
  name: string;
  path: string;
  relationship: string;
  confidence: number;
}

/**
 * Request to analyze user request for flow generation
 */
export interface FlowAnalyzeRequest {
  userRequest: string;
  projectStructure: ProjectFile[];
}

/**
 * Action summary for exploration history
 */
export interface ActionSummary {
  type: string;
  target: string;
  success: boolean;
}

/**
 * Exploration history entry
 */
export interface ExplorationHistory {
  iteration: number;
  understanding_level: number;
  action_summary: ActionSummary;
  key_findings: string[];
  explored_files: string[];
  explored_directories: string[];
  observation?: Record<string, any> | string; // Enhanced: observation from action execution
}

/**
 * Cumulative knowledge across iterations
 */
export interface CumulativeKnowledge {
  confirmed: string[];
  assumptions: string[];
  unknowns: string[];
  explored_files: string[];
  explored_directories: string[];
}

/**
 * Request to explore code iteratively
 */
export interface FlowExploreRequest {
  implementationGoal: string;
  previousJsonResponse?: any;  // Previous ExplorerResponse (kept for backward compatibility)
  previousObservation?: string; // Last observation (kept for backward compatibility)
  explorationHistory?: ExplorationHistory[]; // Full history of all iterations (legacy field name)
  history?: ExplorationHistory[]; // Full history of all iterations (new field name)
  cumulativeKnowledge?: CumulativeKnowledge; // Aggregated knowledge across iterations
}

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
