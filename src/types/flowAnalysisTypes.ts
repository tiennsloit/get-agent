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