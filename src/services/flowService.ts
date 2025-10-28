import type {
  Flow,
  CreateFlowRequest,
  FlowListItem,
  FlowProgress,
  FlowDesignData,
  FlowExecutionData
} from '../../shared/models/flow';
import { FlowState } from '../../shared/models/flow';
import type {
  FlowBlueprintRequest,
  FlowBlueprintResponse,
  FlowSubtasksRequest,
  FlowSubtasksResponse,
  FlowAnalyzeRequest,
  FlowExploreRequest,
  FlowBlueprintFromExplorationRequest,
  ExplorationSummary,
  ProjectFile,
  TodoRequest,
  TodoResponse
} from '../../shared/models/api';
import type {
  FlowAnalysisResponse,
  ExplorerResponse,
  ExplorationHistory,
  CumulativeKnowledge
} from '../types/flowAnalysisTypes';
import { ApiClient, ApiError } from './apiClient';
import { injectable, inject } from 'inversify';
import { INJECTION_KEYS } from '../core/constants/injectionKeys';
import { ContextManager } from '../managers/context/contextManager';
import { FlowStateManager } from '../features/flow/flowStateManager';

export interface IFlowService {
  // CRUD Operations
  createFlow(request: CreateFlowRequest): Promise<string>;
  getFlows(): Promise<FlowListItem[]>;
  getFlow(flowId: string): Promise<Flow | null>;
  updateFlow(flowId: string, updates: Partial<Flow>): Promise<void>;
  deleteFlow(flowId: string): Promise<void>;
  updateFlowTitle(flowId: string, title: string): Promise<void>;

  // State Management
  updateFlowState(flowId: string, state: FlowState): Promise<void>;
  updateFlowProgress(flowId: string, progress: FlowProgress): Promise<void>;
  updateFlowDesignData(flowId: string, updates: Partial<FlowDesignData>): Promise<void>;
  updateFlowExecutionData(flowId: string, updates: Partial<FlowExecutionData>): Promise<void>;

  // Search & Filter
  searchFlows(query: string): Promise<FlowListItem[]>;
  getFlowsByState(state: FlowState): Promise<FlowListItem[]>;

  // API Integration (Mock for now)
  generateBlueprint(request: FlowBlueprintRequest): Promise<FlowBlueprintResponse>;
  generateSubtasks(request: FlowSubtasksRequest): Promise<FlowSubtasksResponse>;

  // User Request Analysis
  analyzeUserRequest(userRequest: string): Promise<FlowAnalysisResponse>;

  // Flow Title Generation
  generateFlowTitle(userRequest: string): Promise<string>;

  // Code Exploration
  exploreCode(
    implementationGoal: string,
    previousResponse?: ExplorerResponse,
    previousObservation?: string,
    explorationHistory?: ExplorationHistory[],
    cumulativeKnowledge?: CumulativeKnowledge
  ): Promise<ExplorerResponse>;

  // Blueprint Generation from Exploration
  generateBlueprintFromExploration(
    implementationGoal: string,
    explorationHistory: ExplorationHistory[],
    cumulativeKnowledge: CumulativeKnowledge,
    analysisContext?: FlowAnalysisResponse
  ): Promise<ReadableStream<Uint8Array>>;

  // TODO Generation from Blueprint
  generateTodoFromBlueprint(
    blueprintContent: string,
    implementationGoal?: string
  ): Promise<TodoResponse>;

  // Event Management
  onFlowUpdate(listener: (flowId?: string) => void): () => void;
}

@injectable()
export class FlowService implements IFlowService {
  private apiClient: ApiClient;

  constructor(
    @inject(INJECTION_KEYS.CONTEXT_MANAGER) private contextManager: ContextManager,
    @inject(INJECTION_KEYS.FLOW_STATE_MANAGER) private flowStateManager: FlowStateManager
  ) {
    // Initialize API client
    this.apiClient = new ApiClient();
  }

  /**
   * Create a new flow
   */
  public async createFlow(request: CreateFlowRequest): Promise<string> {
    return this.flowStateManager.createFlow(request);
  }

  /**
   * Get all flows as list items
   */
  public async getFlows(): Promise<FlowListItem[]> {
    return this.flowStateManager.getAllFlowsAsListItems();
  }

  /**
   * Get a specific flow by ID
   */
  public async getFlow(flowId: string): Promise<Flow | null> {
    return this.flowStateManager.getFlow(flowId) || null;
  }

  /**
   * Update flow data
   */
  public async updateFlow(flowId: string, updates: Partial<Flow>): Promise<void> {
    this.flowStateManager.updateFlow(flowId, updates);
  }

  /**
   * Update flow title
   */
  public async updateFlowTitle(flowId: string, title: string): Promise<void> {
    this.flowStateManager.updateFlowTitle(flowId, title);
  }

  /**
   * Delete a flow
   */
  public async deleteFlow(flowId: string): Promise<void> {
    this.flowStateManager.deleteFlow(flowId);
  }

  /**
   * Update flow state
   */
  public async updateFlowState(flowId: string, state: FlowState): Promise<void> {
    this.flowStateManager.updateFlowState(flowId, state);
  }

  /**
   * Update flow progress
   */
  public async updateFlowProgress(flowId: string, progress: FlowProgress): Promise<void> {
    this.flowStateManager.updateFlowProgress(flowId, progress.done);
  }

  /**
   * Update flow design data
   */
  public async updateFlowDesignData(flowId: string, updates: Partial<FlowDesignData>): Promise<void> {
    this.flowStateManager.updateFlowDesignData(flowId, updates);
  }

  /**
   * Update flow execution data
   */
  public async updateFlowExecutionData(flowId: string, updates: Partial<FlowExecutionData>): Promise<void> {
    this.flowStateManager.updateFlowExecutionData(flowId, updates);
  }

  /**
   * Search flows by query
   */
  public async searchFlows(query: string): Promise<FlowListItem[]> {
    return this.flowStateManager.searchFlows(query);
  }

  /**
   * Get flows filtered by state
   */
  public async getFlowsByState(state: FlowState): Promise<FlowListItem[]> {
    return this.flowStateManager.getFlowsByStateAsListItems(state);
  }

  /**
   * Generate blueprint using mock data
   */
  public async generateBlueprint(request: FlowBlueprintRequest): Promise<FlowBlueprintResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const taskDescription = request.taskDescription;
    const estimatedTasks = Math.max(3, Math.floor(Math.random() * 8) + 2);

    const mockTasks = [];
    for (let i = 1; i <= estimatedTasks; i++) {
      mockTasks.push({
        title: `Task ${i}: ${this.generateTaskTitle(taskDescription, i)}`,
        description: `Implementation step ${i} for ${taskDescription}`,
        files: [
          {
            file: `src/${this.generateFileName(taskDescription, i)}`,
            action: i === 1 ? 'add' as const : 'edit' as const
          }
        ],
        contextFiles: i > 1 ? [`src/${this.generateFileName(taskDescription, i - 1)}`] : []
      });
    }

    return {
      title: `Implementation: ${taskDescription}`,
      description: `Auto-generated blueprint for implementing ${taskDescription}`,
      blueprint: `# ${taskDescription}

## Overview
This blueprint outlines the implementation of ${taskDescription}.

## Implementation Plan

${mockTasks.map((task, i) => `### ${i + 1}. ${task.title}
${task.description}

**Files to modify:**
${task.files.map(f => `- ${f.action}: ${f.file}`).join('\n')}

${task.contextFiles.length > 0 ? `**Context files:**\n${task.contextFiles.join(', ')}` : ''}
`).join('\n')}

## Success Criteria
- All tasks completed successfully
- Code passes quality checks
- Tests are passing
- Documentation is updated`,
      tasks: mockTasks,
      estimatedTasks
    };
  }

  /**
   * Generate subtasks using mock data
   */
  public async generateSubtasks(request: FlowSubtasksRequest): Promise<FlowSubtasksResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const currentTask = request.currentTask;
    const subtasksCount = Math.floor(Math.random() * 5) + 3;

    const mockSubtasks = [];
    for (let i = 1; i <= subtasksCount; i++) {
      mockSubtasks.push({
        id: i,
        type: 'implementation',
        title: `Subtask ${i}`,
        body: `Implement step ${i} of ${currentTask.title}`,
        action: {
          type: 'code',
          syntax: 'typescript',
          target: currentTask.files[0]?.file || 'src/main.ts',
          range: [i * 10, i * 10 + 5] as [number, number],
          value: `// TODO: Implement step ${i}`
        },
        outcome: `Step ${i} completed successfully`,
        visualHint: `Step ${i} implementation`,
        autoAdvance: false
      });
    }

    return { subtasks: mockSubtasks };
  }

  /**
   * Generate flow title based on user request using real API
   */
  public async generateFlowTitle(userRequest: string): Promise<string> {
    try {
      // Validate input
      if (!userRequest || userRequest.trim().length === 0) {
        throw new Error('User request cannot be empty');
      }

      // Build API request payload
      const requestPayload = {
        userRequest: userRequest.trim()
      };

      // Call API
      const response = await this.apiClient.post<{ title: string }>(
        'flow/title',
        requestPayload
      );

      return response.title;
    } catch (error) {
      // Handle API errors with user-friendly messages
      if (error instanceof ApiError) {
        if (error.statusCode === 400) {
          throw new Error(`Invalid request: ${error.message}`);
        } else if (error.statusCode && error.statusCode >= 500) {
          throw new Error('Server error. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Request timeout. Please check your connection and try again.');
        } else {
          throw new Error(`API error: ${error.message}`);
        }
      }

      // Re-throw other errors
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred during title generation');
    }
  }

  /**
   * Analyze user request and generate structured response using real API
   */
  public async analyzeUserRequest(userRequest: string): Promise<FlowAnalysisResponse> {
    try {
      // Validate input
      if (!userRequest || userRequest.trim().length === 0) {
        throw new Error('User request cannot be empty');
      }

      // Collect project structure using ContextManager
      const codeStructure = await this.contextManager.getCodeStructure(true); // Get flattened structure

      // Convert to expected ProjectFile format
      const projectStructure: ProjectFile[] = codeStructure?.map((file: any) => ({
        path: file.path,
        language: file.language
      })) || [];

      // Build API request payload
      const requestPayload: FlowAnalyzeRequest = {
        userRequest: userRequest.trim(),
        projectStructure
      };

      // Call API
      const response = await this.apiClient.post<FlowAnalysisResponse>(
        'flow/analyze',
        requestPayload
      );

      return response;
    } catch (error) {
      // Handle API errors with user-friendly messages
      if (error instanceof ApiError) {
        if (error.statusCode === 400) {
          throw new Error(`Invalid request: ${error.message}`);
        } else if (error.statusCode && error.statusCode >= 500) {
          throw new Error('Server error. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Request timeout. Please check your connection and try again.');
        } else {
          throw new Error(`API error: ${error.message}`);
        }
      }

      // Re-throw other errors
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred during analysis');
    }
  }

  /**
   * Explore code iteratively based on implementation goal
   */
  public async exploreCode(
    implementationGoal: string,
    previousResponse?: ExplorerResponse,
    previousObservation?: string,
    explorationHistory?: ExplorationHistory[],
    cumulativeKnowledge?: CumulativeKnowledge
  ): Promise<ExplorerResponse> {
    try {
      // Validate input
      if (!implementationGoal || implementationGoal.trim().length === 0) {
        throw new Error('Implementation goal cannot be empty');
      }

      // Build API request payload with enhanced context
      // Prefer new 'history' field over legacy 'explorationHistory'
      const requestPayload: FlowExploreRequest = {
        implementationGoal: implementationGoal.trim(),
        history: explorationHistory, // New field name with observations embedded
        cumulativeKnowledge,
        // Legacy fields for backward compatibility
        previousJsonResponse: previousResponse,
        previousObservation
      };

      // Call API
      const response = await this.apiClient.post<ExplorerResponse>(
        'flow/explorer',
        requestPayload
      );

      return response;
    } catch (error) {
      // Handle API errors with user-friendly messages
      if (error instanceof ApiError) {
        if (error.statusCode === 400) {
          throw new Error(`Invalid request: ${error.message}`);
        } else if (error.statusCode && error.statusCode >= 500) {
          throw new Error('Server error. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Request timeout. Please check your connection and try again.');
        } else {
          throw new Error(`API error: ${error.message}`);
        }
      }

      // Re-throw other errors
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred during exploration');
    }
  }

  /**
   * Generate blueprint from exploration results
   */
  public async generateBlueprintFromExploration(
    implementationGoal: string,
    explorationHistory: ExplorationHistory[],
    cumulativeKnowledge: CumulativeKnowledge,
    analysisContext?: FlowAnalysisResponse
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      // Validate input
      if (!implementationGoal?.trim()) {
        throw new Error('Implementation goal cannot be empty');
      }

      if (!explorationHistory?.length) {
        throw new Error('Exploration history is required');
      }

      // Derive exploration summary from history
      const lastEntry = explorationHistory[explorationHistory.length - 1];
      const allFiles = new Set(explorationHistory.flatMap(e => e.explored_files));
      const allDirectories = new Set(explorationHistory.flatMap(e => e.explored_directories));
      const keyFindings = explorationHistory
        .slice(-5)
        .flatMap(e => e.key_findings)
        .filter((f, i, arr) => arr.indexOf(f) === i)
        .slice(0, 10);

      const explorationSummary: ExplorationSummary = {
        totalIterations: explorationHistory.length,
        finalUnderstandingLevel: lastEntry.understanding_level,
        finalConfidenceScore: {
          architecture: 0.8,
          data_flow: 0.7,
          integration_points: 0.75,
          implementation_details: 0.85
        },
        exploredFiles: Array.from(allFiles),
        exploredDirectories: Array.from(allDirectories),
        keyFindings
      };

      // Build API request
      const requestPayload: FlowBlueprintFromExplorationRequest = {
        implementationGoal: implementationGoal.trim(),
        explorationSummary,
        explorationHistory,
        cumulativeKnowledge,
        analysisContext
      };

      // Call API and return stream
      return await this.apiClient.postStream('flow/blueprint', requestPayload);
    } catch (error) {
      if (error instanceof ApiError) {
        const message = error.statusCode === 400 ? `Invalid request: ${error.message}` :
          error.statusCode && error.statusCode >= 500 ? 'Server error. Please try again later.' :
            error.message.includes('timeout') ? 'Request timeout. Please check your connection and try again.' :
              `API error: ${error.message}`;
        throw new Error(message);
      }

      throw error instanceof Error ? error : new Error('An unexpected error occurred during blueprint generation');
    }
  }

  /**
   * Generate TODO list from blueprint
   */
  public async generateTodoFromBlueprint(
    blueprintContent: string,
    implementationGoal?: string
  ): Promise<TodoResponse> {
    try {
      // Validate input
      if (!blueprintContent || blueprintContent.trim().length < 100) {
        throw new Error('Blueprint content must be at least 100 characters');
      }

      // Build API request payload
      const requestPayload: TodoRequest = {
        blueprintContent: blueprintContent.trim(),
        implementationGoal: implementationGoal?.trim()
      };

      // Call API
      const response = await this.apiClient.post<TodoResponse>(
        'flow/todo',
        requestPayload
      );

      return response;
    } catch (error) {
      // Handle API errors with user-friendly messages
      if (error instanceof ApiError) {
        if (error.statusCode === 400) {
          throw new Error(`Invalid request: ${error.message}`);
        } else if (error.statusCode && error.statusCode >= 500) {
          throw new Error('Server error. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Request timeout. Please check your connection and try again.');
        } else {
          throw new Error(`API error: ${error.message}`);
        }
      }

      // Re-throw other errors
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred during TODO generation');
    }
  }

  /**
   * Subscribe to flow updates
   */
  public onFlowUpdate(listener: (flowId?: string) => void): () => void {
    if (this.flowStateManager && typeof this.flowStateManager.onFlowUpdate === 'function') {
      return this.flowStateManager.onFlowUpdate(listener);
    } else {
      console.error('[FlowService] flowStateManager is not properly initialized', this.flowStateManager);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Generate task title based on description
   */
  private generateTaskTitle(description: string, step: number): string {
    const words = description.toLowerCase().split(' ');
    const actionWords = ['setup', 'create', 'implement', 'configure', 'add', 'build', 'test', 'deploy'];

    if (step === 1) {
      return `Setup ${words[0]} structure`;
    } else if (step === 2) {
      return `Implement core ${words[0]} logic`;
    } else if (step === 3) {
      return `Add ${words[0]} validation`;
    } else {
      const action = actionWords[step % actionWords.length];
      return `${action.charAt(0).toUpperCase() + action.slice(1)} ${words[0]} features`;
    }
  }

  /**
   * Generate file name based on description
   */
  private generateFileName(description: string, step: number): string {
    const words = description.toLowerCase().split(' ');
    const baseName = words[0] || 'component';

    if (step === 1) {
      return `${baseName}.ts`;
    } else if (step === 2) {
      return `${baseName}Service.ts`;
    } else if (step === 3) {
      return `${baseName}Validator.ts`;
    } else {
      return `${baseName}Utils.ts`;
    }
  }
}