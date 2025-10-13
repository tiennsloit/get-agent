/**
 * Flow detail provider for managing flow details webview
 */

import * as vscode from 'vscode';
import { FlowService } from '../../services/flowService';
import { FlowExecutor } from './flowExecutor';
import { FlowDetailPanelRegistry } from './flowDetailPanelRegistry';
import { getWebviewContent } from '../../core/utilities/getWebviewContent';
import { DiContainer } from '../../core/di-container';
import { INJECTION_KEYS } from '../../core/constants/injectionKeys';
import type { FlowAnalysisResponse } from './types/flowAnalysisTypes';

export class FlowDetailProvider {
  private panel: vscode.WebviewPanel | undefined;
  private flowService: FlowService;
  private flowExecutor: FlowExecutor;
  private flowId: string;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    flowId: string
  ) {
    this.flowId = flowId;
    this.flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);
    this.flowExecutor = DiContainer.get<FlowExecutor>(INJECTION_KEYS.FLOW_EXECUTOR);
  }

  /**
   * Set the webview panel
   */
  public setWebviewPanel(panel: vscode.WebviewPanel): void {
    this.panel = panel;
    this.setupMessageHandling();

    // Register this panel with the registry
    const registry = FlowDetailPanelRegistry.getInstance();
    registry.registerPanel(this.flowId, this);

    // Send initial flow data
    this.sendFlowData();

    // Handle panel disposal
    panel.onDidDispose(() => {
      // Unregister from the registry
      registry.unregisterPanel(this.flowId);
      this.dispose();
    }, null, this.disposables);
  }

  /**
   * Get HTML content for the webview
   */
  public getHtmlForWebview(webview: vscode.Webview): string {
    // In development, use dev server
    if (process.env.VSCODE_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development') {
      return this.getDevHtml();
    }

    // In production, use built files
    return getWebviewContent(webview, this.context.extensionUri, 'flow-detail');
  }

  /**
   * Setup message handling between webview and extension
   */
  private setupMessageHandling(): void {
    if (!this.panel) { return; }

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getFlowData':
            this.sendFlowData();
            break;

          case 'updateFlowState':
            this.handleUpdateFlowState(message.data);
            break;

          case 'startExecution':
            await this.handleStartExecution();
            break;

          case 'pauseExecution':
            this.handlePauseExecution();
            break;

          case 'stopExecution':
            this.handleStopExecution();
            break;

          case 'updateBlueprint':
            this.handleUpdateBlueprint(message.data);
            break;

          case 'analyzeUserRequest':
            await this.handleAnalyzeUserRequest(message.data);
            break;

          default:
            console.warn('Unknown message command:', message.command);
        }
      },
      undefined,
      this.disposables
    );
  }

  /**
   * Handle user request analysis
   */
  private async handleAnalyzeUserRequest(data: { flowId: string; userRequest: string }): Promise<void> {
    try {
      const analysis: FlowAnalysisResponse = await this.flowService.analyzeUserRequest(data.userRequest);
      
      this.panel?.webview.postMessage({
        command: 'analyzeUserResponse',
        data: { analysis }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.panel?.webview.postMessage({
        command: 'analyzeUserResponse',
        data: { error: errorMessage }
      });
      
      console.error('Error analyzing user request:', error);
    }
  }

  /**
   * Send flow data to webview
   */
  private async sendFlowData(): Promise<void> {
    if (!this.panel) { return; }

    const flow = await this.flowService.getFlow(this.flowId);

    // If flow doesn't exist, show error
    if (!flow) {
      this.panel.webview.postMessage({
        command: 'flowDataError',
        data: { error: `Flow with ID ${this.flowId} not found` }
      });
      return;
    }

    this.panel.webview.postMessage({
      command: 'flowDataUpdate',
      data: { flow }
    });
  }

  /**
   * Refresh flow data (called by registry when flow is updated)
   */
  public refreshFlowData(): void {
    this.sendFlowData();
  }

  /**
   * Show/focus the panel
   */
  public show(): void {
    if (this.panel) {
      this.panel.reveal();
    }
  }


  /**
   * Handle flow state update
   */
  private async handleUpdateFlowState(data: { state: any }): Promise<void> {
    await this.flowService.updateFlowState(this.flowId, data.state);
    this.sendFlowData();
  }

  /**
   * Handle start execution
   */
  private async handleStartExecution(): Promise<void> {
    try {
      await this.flowExecutor.executeFlow(this.flowId);
      this.sendFlowData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.panel?.webview.postMessage({
        command: 'executionError',
        data: { error: errorMessage }
      });
    }
  }

  /**
   * Handle pause execution
   */
  private handlePauseExecution(): void {
    this.flowExecutor.pauseFlow();
    this.sendFlowData();
  }

  /**
   * Handle stop execution
   */
  private handleStopExecution(): void {
    this.flowExecutor.stopFlow();
    this.sendFlowData();
  }

  /**
   * Handle blueprint update
   */
  private async handleUpdateBlueprint(data: { blueprint: string }): Promise<void> {
    // TODO: Parse blueprint and extract tasks
    const tasks: any[] = []; // Placeholder

    // Update flow with new blueprint and tasks
    const flow = await this.flowService.getFlow(this.flowId);
    if (flow) {
      await this.flowService.updateFlow(this.flowId, {
        blueprint: data.blueprint,
        tasks: tasks
      });
      this.sendFlowData();
    }
  }

  /**
   * Get development HTML
   */
  private getDevHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang=\"\">
      <head>
        <script type=\"module\" src=\"http://localhost:5174/@id/virtual:vue-devtools-path:overlay.js\"></script>
        <script type=\"module\" src=\"http://localhost:5174/@id/virtual:vue-inspector-path:load.js\"></script>
        <script type=\"module\" src=\"http://localhost:5174/@vite/client\"></script>
        <meta charset=\"UTF-8\">
        <link rel=\"icon\" href=\"http://localhost:5174/favicon.ico\">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap" rel="stylesheet">
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
        <title>Flow Details</title>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
          #app { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id=\"app\"></div>
        <script type=\"module\" src=\"http://localhost:5174/src/main.ts\"></script>
      </body>
      </html>
    `;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}