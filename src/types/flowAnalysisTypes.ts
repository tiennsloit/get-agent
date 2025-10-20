/**
 * Flow analysis types for the Analyze User Request feature
 */

/**
 * Integration point in the system
 */
export interface IntegrationPoint {
  system: string;
  endpoint: string;
  purpose: string;
}

/**
 * Exploration targets for code analysis
 */
export interface ExplorationTargets {
  files: string[];
  directories: string[];
  patterns: string[];
}

/**
 * Complexity factors for the implementation
 */
export interface ComplexityFactors {
  integration_complexity: string;
  testing_requirements: string;
  refactoring_needed: string;
  external_dependencies: string;
}

/**
 * Response structure for flow analysis
 */
export interface FlowAnalysisResponse {
  core_requirement: {
    summary: string;
    main_objective: string;
    type: string;
  };
  technical_tasks: string[];
  affected_modules: string[];
  integration_points: IntegrationPoint[];
  search_keywords: string[];
  exploration_targets: ExplorationTargets;
  estimated_complexity: string;
  complexity_factors: ComplexityFactors;
  prerequisites: string[];
  risk_factors: string[];
}

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
  confirmed_facts: string[];
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
 * Directory entry for list_directory action results
 */
export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  language?: string;
}

/**
 * Directory listing data structure
 */
export interface DirectoryListing {
  path: string;
  entries: DirectoryEntry[];
  totalFiles: number;
  totalDirectories: number;
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