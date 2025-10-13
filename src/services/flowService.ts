/**
 * Flow service for managing flow data and API integration
 */

import type {
  Flow,
  CreateFlowRequest,
  FlowListItem,
  FlowProgress
} from '../features/flow/types/flowState';
import { FlowState } from '../features/flow/types/flowState';
import type {
  FlowBlueprintRequest,
  FlowBlueprintResponse,
  FlowSubtasksRequest,
  FlowSubtasksResponse
} from '../features/flow/types/apiTypes';

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
  analyzeUserRequest(userRequest: string): Promise<any>;
  
  // Event Management
  onFlowUpdate(listener: (flowId?: string) => void): () => void;
}

export class FlowService implements IFlowService {
  private flows: Map<string, Flow> = new Map();
  private updateListeners: ((flowId?: string) => void)[] = [];

  constructor() {
    // Initialize with some mock data for testing
    this.initializeMockData();
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
   * Analyze user request and generate structured response
   */
  public async analyzeUserRequest(userRequest: string): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock response
    return {
      "core_requirement": {
        "summary": "Integrate DeepSeek API for AI-powered flow blueprint and subtask generation",
        "main_objective": "Enable flow-detail webview to use DeepSeek's reasoning capabilities",
        "type": "api_integration"
      },
      "technical_tasks": [
        "Configure DeepSeek provider with API credentials",
        "Extend RemoteAIClient to support DeepSeek endpoints",
        "Create prompt templates for blueprint generation",
        "Implement response parsing for DeepSeek format",
        "Add error handling and fallback mechanisms",
        "Update FlowApiService to route DeepSeek requests"
      ],
      "affected_modules": [
        "flow-detail-webview",
        "FlowApiService",
        "GoNextService",
        "AIClient",
        "RemoteAIClient",
        "ProService"
      ],
      "integration_points": [
        {
          "system": "DeepSeek API",
          "endpoint": "/chat/completions",
          "purpose": "Blueprint and subtask generation"
        },
        {
          "system": "Flow Detail Webview",
          "interface": "FlowApiService",
          "purpose": "Display generated blueprints"
        }
      ],
      "search_keywords": [
        "flow",
        "blueprint",
        "deepseek",
        "AIClient",
        "RemoteAIClient",
        "FlowApiService",
        "generateBlueprint",
        "subtask",
        "provider",
        "completion"
      ],
      "exploration_targets": {
        "files": [
          "src/services/flowApiService.ts",
          "src/services/goNextService.ts",
          "src/services/aiClient.ts",
          "src/services/remoteAIClient.ts",
          "src/providers/flowDetailProvider.ts",
          "config/providers.json",
          "config/features.json"
        ],
        "directories": [
          "src/services/",
          "src/providers/",
          "src/webviews/flow-detail/",
          "config/"
        ],
        "patterns": [
          "**/flow*.ts",
          "**/*AIClient*.ts",
          "**/provider*.json"
        ]
      },
      "estimated_complexity": "medium",
      "complexity_factors": {
        "integration_complexity": "medium",
        "testing_requirements": "high",
        "refactoring_needed": "low",
        "external_dependencies": "medium"
      },
      "prerequisites": [
        "DeepSeek API key",
        "Understanding of current flow generation logic",
        "Knowledge of AIClient architecture"
      ],
      "risk_factors": [
        "API rate limiting",
        "Response format compatibility",
        "Fallback mechanism complexity"
      ]
    };
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