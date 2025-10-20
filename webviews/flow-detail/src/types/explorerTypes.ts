/**
 * Flow exploration types for webview
 * Mirrors types from src/types/flowAnalysisTypes.ts
 */

/**
 * Action types for code exploration
 */
export type ActionType = 'read_file' | 'search_content' | 'read_terminal' | 'list_directory';

/**
 * Action to perform during exploration
 */
export interface Action {
  type: ActionType;
  parameters: {
    path?: string;        // For read_file and list_directory
    recursive?: boolean;  // For list_directory
    query?: string;       // For search_content
    scope?: string;       // For search_content
    command?: string;     // For read_terminal
  };
  expected_insights: string;
}

/**
 * Observation container for action results
 */
export interface Observation {
  action_type: ActionType;
  result: string;
  timestamp: string;
}

/**
 * Confidence scores per dimension
 */
export interface ConfidenceScore {
  architecture: number;
  data_flow: number;
  integration_points: number;
  implementation_details: number;
}

/**
 * Current knowledge state during exploration
 */
export interface CurrentKnowledge {
  confirmed: string[];
  assumptions: string[];
  unknowns: string[];
  explored_files?: string[];
  explored_directories?: string[];
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
 * Response from explorer API
 */
export interface ExplorerResponse {
  iteration: number;
  understanding_level: number;
  confidence_score: ConfidenceScore;
  thinking: string;
  current_knowledge: CurrentKnowledge;
  action: Action;
  observation?: Observation;
  continue_exploration: boolean;
  next_priorities: string[];
}

/**
 * Result from executing an action
 */
export interface ActionResult {
  actionType: ActionType;
  success: boolean;
  data: any;
  error?: string;
  timestamp: string;
}

/**
 * Context for exploration loop
 */
export interface ExplorerContext {
  isExploring: boolean;
  currentIteration: number;
  previousResponse: ExplorerResponse | null;
  implementationGoal: string;
  observations: string[];
  maxIterations: number;
}
