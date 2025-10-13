/**
 * Flow state manager for managing flow data and persistence
 */

import * as vscode from 'vscode';
import type { 
  Flow, 
  CreateFlowRequest, 
  Task, 
  ExecutionReport,
  FlowListItem 
} from '../../types/flowState';
import { FlowState } from '../../types/flowState';
import { generateId } from '../../core/utilities/generateId';

export class FlowStateManager {
  private static instance: FlowStateManager;
  private context: vscode.ExtensionContext;
  private flows: Map<string, Flow> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadFlowsFromStorage();
  }

  public static getInstance(context?: vscode.ExtensionContext): FlowStateManager {
    if (!FlowStateManager.instance && context) {
      FlowStateManager.instance = new FlowStateManager(context);
    }
    return FlowStateManager.instance;
  }

  /**
   * Create a new flow
   */
  public createFlow(request: CreateFlowRequest): string {
    const flowId = generateId();
    const now = new Date().toISOString();
    
    const flow: Flow = {
      id: flowId,
      title: request.title,
      state: FlowState.TODO,
      tasks: [],
      progress: { done: 0, total: 0 },
      startTime: now,
      lastUpdated: now
    };

    this.flows.set(flowId, flow);
    this.saveFlowsToStorage();
    
    return flowId;
  }

  /**
   * Get a flow by ID
   */
  public getFlow(flowId: string): Flow | undefined {
    return this.flows.get(flowId);
  }

  /**
   * Get all flows
   */
  public getAllFlows(): Flow[] {
    return Array.from(this.flows.values());
  }

  /**
   * Get flows filtered by state
   */
  public getFlowsByState(state: FlowState): Flow[] {
    return this.getAllFlows().filter(flow => flow.state === state);
  }

  /**
   * Get flows in progress (designing, executing, paused)
   */
  public getInProgressFlows(): FlowListItem[] {
    const inProgressStates = [FlowState.DESIGNING, FlowState.EXECUTING, FlowState.PAUSED];
    return this.getAllFlows()
      .filter(flow => inProgressStates.includes(flow.state))
      .map(flow => this.toFlowListItem(flow))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  /**
   * Get completed flows (completed, cancelled)
   */
  public getCompletedFlows(): FlowListItem[] {
    const completedStates = [FlowState.COMPLETED, FlowState.CANCELLED];
    return this.getAllFlows()
      .filter(flow => completedStates.includes(flow.state))
      .map(flow => this.toFlowListItem(flow))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  /**
   * Update flow state
   */
  public updateFlowState(flowId: string, state: FlowState): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.state = state;
      flow.lastUpdated = new Date().toISOString();
      this.flows.set(flowId, flow);
      this.saveFlowsToStorage();
    }
  }

  /**
   * Update flow blueprint
   */
  public updateFlowBlueprint(flowId: string, blueprint: string, tasks: Task[]): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.blueprint = blueprint;
      flow.tasks = tasks;
      flow.progress.total = tasks.length;
      flow.lastUpdated = new Date().toISOString();
      this.flows.set(flowId, flow);
      this.saveFlowsToStorage();
    }
  }

  /**
   * Update flow progress
   */
  public updateFlowProgress(flowId: string, done: number): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.progress.done = done;
      flow.lastUpdated = new Date().toISOString();
      this.flows.set(flowId, flow);
      this.saveFlowsToStorage();
    }
  }

  /**
   * Set flow execution report
   */
  public setFlowExecutionReport(flowId: string, report: ExecutionReport): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      flow.executionReport = report;
      flow.lastUpdated = new Date().toISOString();
      this.flows.set(flowId, flow);
      this.saveFlowsToStorage();
    }
  }

  /**
   * Delete a flow
   */
  public deleteFlow(flowId: string): void {
    this.flows.delete(flowId);
    this.saveFlowsToStorage();
  }

  /**
   * Search flows by title or description
   */
  public searchFlows(query: string): FlowListItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllFlows()
      .filter(flow => 
        flow.title.toLowerCase().includes(lowercaseQuery) ||
        flow.description?.toLowerCase().includes(lowercaseQuery)
      )
      .map(flow => this.toFlowListItem(flow))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
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
   * Load flows from VS Code storage
   */
  private loadFlowsFromStorage(): void {
    const storedFlows = this.context.globalState.get<Record<string, Flow>>('gonext.flows', {});
    this.flows = new Map(Object.entries(storedFlows));
  }

  /**
   * Save flows to VS Code storage
   */
  private saveFlowsToStorage(): void {
    const flowsObject = Object.fromEntries(this.flows);
    this.context.globalState.update('gonext.flows', flowsObject);
  }
}