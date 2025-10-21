import type {
  Flow,
  CreateFlowRequest,
  FlowListItem,
  FlowProgress
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
  ProjectFile
} from '../../shared/models/api';
import type { 
  FlowAnalysisResponse, 
  ExplorerResponse,
  ActionType,
  ActionResult,
  ExplorationHistory,
  CumulativeKnowledge
} from '../types/flowAnalysisTypes';
import { ApiClient, ApiError } from './apiClient';
import { injectable, inject } from 'inversify';
import { INJECTION_KEYS } from '../core/constants/injectionKeys';
import { ContextManager } from '../managers/context/contextManager';

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

  // Search & Filter
  searchFlows(query: string): Promise<FlowListItem[]>;
  getFlowsByState(state: FlowState): Promise<FlowListItem[]>;

  // API Integration (Mock for now)
  generateBlueprint(request: FlowBlueprintRequest): Promise<FlowBlueprintResponse>;
  generateSubtasks(request: FlowSubtasksRequest): Promise<FlowSubtasksResponse>;

  // User Request Analysis
  analyzeUserRequest(userRequest: string): Promise<FlowAnalysisResponse>;
  
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
  
  // Event Management
  onFlowUpdate(listener: (flowId?: string) => void): () => void;
}

@injectable()
export class FlowService implements IFlowService {
  private flows: Map<string, Flow> = new Map();
  private updateListeners: ((flowId?: string) => void)[] = [];
  private apiClient: ApiClient;

  constructor(
    @inject(INJECTION_KEYS.CONTEXT_MANAGER) private contextManager: ContextManager
  ) {
    // Initialize with some mock data for testing
    this.initializeMockData();
    
    // Initialize API client
    this.apiClient = new ApiClient();
  }

  /**
   * Initialize with some mock data
   */
  private initializeMockData(): void {
    const mockFlows: Flow[] = [
      {
        id: '1',
        title: 'Implement user authentication',
        description: 'Add user login and registration functionality',
        state: FlowState.TODO,
        tasks: [],
        progress: { done: 0, total: 5 },
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Create dashboard UI',
        description: 'Design and implement the main dashboard interface',
        state: FlowState.DESIGNING,
        tasks: [],
        progress: { done: 2, total: 8 },
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: '3',
        title: 'API integration',
        description: 'Connect frontend to backend services',
        state: FlowState.EXECUTING,
        tasks: [],
        progress: { done: 3, total: 6 },
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    ];

    mockFlows.forEach(flow => {
      this.flows.set(flow.id, flow);
    });
  }

  /**
   * Create a new flow
   */
  public async createFlow(request: CreateFlowRequest): Promise<string> {
    const flowId = this.generateId();
    const now = new Date().toISOString();
    
    const newFlow: Flow = {
      id: flowId,
      title: request.title,
      state: FlowState.TODO,
      tasks: [],
      progress: { done: 0, total: 0 },
      startTime: now,
      lastUpdated: now
    };

    this.flows.set(flowId, newFlow);
    this.notifyFlowUpdate(flowId);
    return flowId;
  }

  /**
   * Get all flows as list items
   */
  public async getFlows(): Promise<FlowListItem[]> {
    const flows = Array.from(this.flows.values());
    return flows.map(flow => this.toFlowListItem(flow));
  }

  /**
   * Get a specific flow by ID
   */
  public async getFlow(flowId: string): Promise<Flow | null> {
    const flow = this.flows.get(flowId);
    return flow || null;
  }

  /**
   * Update flow data
   */
  public async updateFlow(flowId: string, updates: Partial<Flow>): Promise<void> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }

    // Apply updates
    Object.assign(flow, updates);
    flow.lastUpdated = new Date().toISOString();

    this.flows.set(flowId, flow);
    this.notifyFlowUpdate(flowId);
  }

  /**
   * Update flow title
   */
  public async updateFlowTitle(flowId: string, title: string): Promise<void> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }

    flow.title = title;
    flow.lastUpdated = new Date().toISOString();

    this.flows.set(flowId, flow);
    this.notifyFlowUpdate(flowId);
  }

  /**
   * Delete a flow
   */
  public async deleteFlow(flowId: string): Promise<void> {
    this.flows.delete(flowId);
    this.notifyFlowUpdate();
  }

  /**
   * Update flow state
   */
  public async updateFlowState(flowId: string, state: FlowState): Promise<void> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }

    flow.state = state;
    flow.lastUpdated = new Date().toISOString();

    this.flows.set(flowId, flow);
    this.notifyFlowUpdate(flowId);
  }

  /**
   * Update flow progress
   */
  public async updateFlowProgress(flowId: string, progress: FlowProgress): Promise<void> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }

    flow.progress = progress;
    flow.lastUpdated = new Date().toISOString();

    this.flows.set(flowId, flow);
    this.notifyFlowUpdate(flowId);
  }

  /**
   * Search flows by query
   */
  public async searchFlows(query: string): Promise<FlowListItem[]> {
    const flows = Array.from(this.flows.values());
    const filtered = flows.filter(flow => 
      flow.title.toLowerCase().includes(query.toLowerCase()) ||
      (flow.description && flow.description.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.map(flow => this.toFlowListItem(flow));
  }

  /**
   * Get flows filtered by state
   */
  public async getFlowsByState(state: FlowState): Promise<FlowListItem[]> {
    const flows = Array.from(this.flows.values());
    const filtered = flows.filter(flow => flow.state === state);
    return filtered.map(flow => this.toFlowListItem(flow));
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
      if (!implementationGoal || implementationGoal.trim().length === 0) {
        throw new Error('Implementation goal cannot be empty');
      }

      if (!explorationHistory || explorationHistory.length === 0) {
        throw new Error('Exploration history is required');
      }

      // Derive exploration summary from history
      const lastEntry = explorationHistory[explorationHistory.length - 1];
      
      // Collect all unique files and directories
      const allFiles = new Set<string>();
      const allDirectories = new Set<string>();
      
      explorationHistory.forEach(entry => {
        entry.explored_files.forEach(f => allFiles.add(f));
        entry.explored_directories.forEach(d => allDirectories.add(d));
      });

      // Extract key findings from most recent iterations (last 5)
      const recentIterations = explorationHistory.slice(-5);
      const keyFindings: string[] = [];
      recentIterations.forEach(entry => {
        entry.key_findings.forEach(finding => {
          if (!keyFindings.includes(finding) && keyFindings.length < 10) {
            keyFindings.push(finding);
          }
        });
      });

      const explorationSummary: ExplorationSummary = {
        totalIterations: explorationHistory.length,
        finalUnderstandingLevel: lastEntry.understanding_level,
        finalConfidenceScore: {
          architecture: 0.8, // These would come from the last explorer response
          data_flow: 0.7,
          integration_points: 0.75,
          implementation_details: 0.85
        },
        exploredFiles: Array.from(allFiles),
        exploredDirectories: Array.from(allDirectories),
        keyFindings
      };

      // Build API request payload
      const requestPayload: FlowBlueprintFromExplorationRequest = {
        implementationGoal: implementationGoal.trim(),
        explorationSummary,
        explorationHistory,
        cumulativeKnowledge,
        analysisContext
      };

      // Call API and return stream
      const stream = await this.apiClient.postStream(
        'flow/blueprint',
        requestPayload
      );

      return stream;
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

      throw new Error('An unexpected error occurred during blueprint generation');
    }
  }

  /**
   * Subscribe to flow updates
   */
  public onFlowUpdate(listener: (flowId?: string) => void): () => void {
    this.updateListeners.push(listener);
    return () => {
      const index = this.updateListeners.indexOf(listener);
      if (index !== -1) {
        this.updateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of flow updates
   */
  private notifyFlowUpdate(flowId?: string): void {
    // Notify local listeners
    this.updateListeners.forEach(listener => listener(flowId));
  }

  /**
   * Convert Flow to FlowListItem
   */
  private toFlowListItem(flow: Flow): FlowListItem {
    return {
      id: flow.id,
      title: flow.title,
      state: flow.state,
      progress: flow.progress,
      lastUpdated: flow.lastUpdated
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
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