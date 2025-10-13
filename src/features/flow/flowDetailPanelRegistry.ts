/**
 * Registry for managing flow detail panels and notifications
 */

import * as vscode from 'vscode';
import type { FlowDetailProvider } from './flowDetailProvider';

export class FlowDetailPanelRegistry {
  private static instance: FlowDetailPanelRegistry;
  private panels: Map<string, FlowDetailProvider> = new Map();

  public static getInstance(): FlowDetailPanelRegistry {
    if (!FlowDetailPanelRegistry.instance) {
      FlowDetailPanelRegistry.instance = new FlowDetailPanelRegistry();
    }
    return FlowDetailPanelRegistry.instance;
  }

  /**
   * Register a flow detail panel
   */
  public registerPanel(flowId: string, provider: FlowDetailProvider): void {
    this.panels.set(flowId, provider);
  }

  /**
   * Unregister a flow detail panel
   */
  public unregisterPanel(flowId: string): void {
    this.panels.delete(flowId);
  }

  /**
   * Notify a specific flow detail panel of updates
   */
  public notifyFlowUpdate(flowId: string): void {
    const provider = this.panels.get(flowId);
    if (provider) {
      // Call a method on the provider to refresh its data
      provider.refreshFlowData();
    }
  }

  /**
   * Notify all flow detail panels
   */
  public notifyAllPanels(): void {
    this.panels.forEach((provider, flowId) => {
      provider.refreshFlowData();
    });
  }

  /**
   * Get all registered flow IDs
   */
  public getRegisteredFlowIds(): string[] {
    return Array.from(this.panels.keys());
  }

  /**
   * Check if a flow detail panel is open for a specific flow
   */
  public isPanelOpen(flowId: string): boolean {
    return this.panels.has(flowId);
  }

  /**
   * Get an existing flow detail provider
   */
  public getPanel(flowId: string): FlowDetailProvider | undefined {
    return this.panels.get(flowId);
  }

  /**
   * Show/focus an existing panel for a specific flow
   */
  public showPanel(flowId: string): boolean {
    const provider = this.panels.get(flowId);
    if (provider) {
      provider.show();
      return true;
    }
    return false;
  }
}