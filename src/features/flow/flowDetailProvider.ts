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
import type { FlowAnalysisResponse, ExplorerResponse, ActionResult, ExplorationHistory, CumulativeKnowledge } from '../../types/flowAnalysisTypes';
import { ContextManager } from '../../managers/context/contextManager';

export class FlowDetailProvider {
  private panel: vscode.WebviewPanel | undefined;
  private flowService: FlowService;
  private flowExecutor: FlowExecutor;
  private contextManager: ContextManager;
  private flowId: string;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    flowId: string
  ) {
    this.flowId = flowId;
    this.flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);
    this.flowExecutor = DiContainer.get<FlowExecutor>(INJECTION_KEYS.FLOW_EXECUTOR);
    this.contextManager = DiContainer.get<ContextManager>(INJECTION_KEYS.CONTEXT_MANAGER);
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

          case 'exploreCode':
            await this.handleExploreCode(message.data);
            break;

          case 'performAction':
            await this.handlePerformAction(message.data);
            break;

          case 'stopExploration':
            this.handleStopExploration(message.data);
            break;

          case 'generateBlueprintFromExploration':
            await this.handleGenerateBlueprintFromExploration(message.data);
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
   * Handle code exploration request
   */
  private async handleExploreCode(data: {
    flowId: string;
    implementationGoal: string;
    previousResponse?: ExplorerResponse;
    previousObservation?: string;
    explorationHistory?: ExplorationHistory[];
    history?: ExplorationHistory[]; // New field name
    cumulativeKnowledge?: CumulativeKnowledge;
  }): Promise<void> {
    // Support both 'explorationHistory' and 'history' field names
    const actualHistory = data.history || data.explorationHistory;

    console.log(`[FlowDetailProvider] Starting code exploration for flow ${data.flowId}`, {
      iteration: data.previousResponse?.iteration ?? 0,
      hasObservation: !!data.previousObservation,
      historyLength: actualHistory?.length ?? 0
    });

    try {
      const response: ExplorerResponse = await this.flowService.exploreCode(
        data.implementationGoal,
        data.previousResponse,
        data.previousObservation,
        actualHistory, // Use the unified history
        data.cumulativeKnowledge
      );

      console.log(`[FlowDetailProvider] Exploration iteration ${response.iteration} complete`, {
        understandingLevel: response.understanding_level,
        continueExploration: response.continue_exploration,
        actionType: response.action.type
      });

      this.panel?.webview.postMessage({
        command: 'explorerResponse',
        data: { response }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[FlowDetailProvider] Exploration error:`, error);

      this.panel?.webview.postMessage({
        command: 'explorationError',
        data: { error: errorMessage }
      });
    }
  }

  /**
   * Handle action execution request
   */
  private async handlePerformAction(data: {
    flowId: string;
    action: any;
    iteration: number;
  }): Promise<void> {
    console.log(`[FlowDetailProvider] Executing action for iteration ${data.iteration}`, {
      actionType: data.action.type,
      parameters: data.action.parameters
    });

    try {
      const result: ActionResult = await this.contextManager.performExplorationAction(
        data.action.type,
        data.action.parameters,
      );

      console.log(`[FlowDetailProvider] Action ${data.action.type} ${result.success ? 'succeeded' : 'failed'}`, {
        hasData: !!result.data,
        error: result.error
      });

      this.panel?.webview.postMessage({
        command: 'actionResult',
        data: { result }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[FlowDetailProvider] Action execution error:`, error);

      // Send error as action result
      const errorResult: ActionResult = {
        actionType: data.action.type,
        success: false,
        data: null,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };

      this.panel?.webview.postMessage({
        command: 'actionResult',
        data: { result: errorResult }
      });
    }
  }

  /**
   * Handle blueprint generation from exploration results
   */
  private async handleGenerateBlueprintFromExploration(data: {
    flowId: string;
    implementationGoal: string;
    explorationHistory: ExplorationHistory[];
    cumulativeKnowledge: CumulativeKnowledge;
    analysisContext?: FlowAnalysisResponse;
  }): Promise<void> {
    console.log(`[FlowDetailProvider] Generating blueprint from exploration for flow ${data.flowId}`, {
      iterations: data.explorationHistory.length,
      confirmedFacts: data.cumulativeKnowledge.confirmed.length
    });

    try {
      const stream = await this.flowService.generateBlueprintFromExploration(
        data.implementationGoal,
        data.explorationHistory,
        data.cumulativeKnowledge,
        data.analysisContext
      );

      // Read the stream and forward chunks to webview
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Send completion signal
            this.panel?.webview.postMessage({
              command: 'blueprintComplete',
              data: { success: true }
            });
            break;
          }

          // Decode chunk and parse SSE events
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('event: chunk')) {
              // Next line should be data
              const dataLineIndex = lines.indexOf(line) + 1;
              if (dataLineIndex < lines.length) {
                const dataLine = lines[dataLineIndex];
                if (dataLine.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(dataLine.substring(6));
                    this.panel?.webview.postMessage({
                      command: 'blueprintChunk',
                      data: { chunk: data.chunk }
                    });
                  } catch (e) {
                    console.error('Failed to parse SSE data:', e);
                  }
                }
              }
            } else if (line.startsWith('event: error')) {
              const dataLineIndex = lines.indexOf(line) + 1;
              if (dataLineIndex < lines.length) {
                const dataLine = lines[dataLineIndex];
                if (dataLine.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(dataLine.substring(6));
                    throw new Error(data.error);
                  } catch (e) {
                    console.error('Stream error:', e);
                  }
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('[FlowDetailProvider] Blueprint generation complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[FlowDetailProvider] Blueprint generation error:', error);

      this.panel?.webview.postMessage({
        command: 'blueprintError',
        data: { error: errorMessage }
      });
    }
  }

  /**
   * Handle stop exploration request
   */
  private handleStopExploration(data: { flowId: string }): void {
    // For now, just acknowledge the stop request
    // The actual loop control is handled in the webview
    console.log(`Exploration stopped for flow ${data.flowId}`);
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
   * Update the panel title
   */
  public updateTitle(title: string): void {
    if (this.panel) {
      this.panel.title = title;
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