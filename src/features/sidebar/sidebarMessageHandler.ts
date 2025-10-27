import * as vscode from "vscode";
import { FlowService } from "../../services/flowService";
import { FlowDetailProvider } from "../flow/flowDetailProvider";
import { FlowDetailPanelRegistry } from "../flow/flowDetailPanelRegistry";
import { FlowStateManager } from "../flow/flowStateManager";
import { WebviewOutputCommands, WebviewInputCommands } from "../../../shared/constants/commands";
import type { CreateFlowRequest } from "../../../shared/models/flow";

export interface SidebarMessageHandlerOptions {
  context: vscode.ExtensionContext;
  flowService: FlowService;
  flowStateManager: FlowStateManager;
  extensionUri: vscode.Uri;
  isDevelopment: boolean;
}

/**
 * Handles message communication between sidebar webview and extension
 */
export class SidebarMessageHandler {
  private context: vscode.ExtensionContext;
  private flowService: FlowService;
  private flowStateManager: FlowStateManager;
  private extensionUri: vscode.Uri;
  private isDevelopment: boolean;
  private webview?: vscode.Webview;
  private unsubscribeFlowUpdates?: () => void;

  constructor(options: SidebarMessageHandlerOptions) {
    this.context = options.context;
    this.flowService = options.flowService;
    this.flowStateManager = options.flowStateManager;
    this.extensionUri = options.extensionUri;
    this.isDevelopment = options.isDevelopment;
  }

  /**
   * Set the webview instance and subscribe to flow updates
   */
  public setWebview(webview: vscode.Webview): void {
    this.webview = webview;
    
    // Subscribe to flow state changes
    this.unsubscribeFlowUpdates = this.flowStateManager.onFlowUpdate(() => {
      this.syncFlowList();
    });
  }

  /**
   * Cleanup subscriptions
   */
  public dispose(): void {
    if (this.unsubscribeFlowUpdates) {
      this.unsubscribeFlowUpdates();
    }
  }

  /**
   * Sync flow list with the webview
   */
  private async syncFlowList(): Promise<void> {
    if (!this.webview) {
      return;
    }

    const flows = await this.flowService.getFlows();
    this.webview.postMessage({
      command: WebviewInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle incoming message from webview
   */
  public async handleMessage(webview: vscode.Webview, message: any): Promise<void> {
    const { command, data } = message;

    try {
      switch (command) {
        case WebviewOutputCommands.GET_FLOWS:
          await this.handleGetFlows(webview);
          break;

        case WebviewOutputCommands.CREATE_FLOW:
          await this.handleCreateFlow(webview, data);
          break;

        case WebviewOutputCommands.OPEN_FLOW_DETAILS:
          await this.handleOpenFlowDetails(data);
          break;

        case WebviewOutputCommands.SEARCH_FLOWS:
          await this.handleSearchFlows(webview, data);
          break;

        case WebviewOutputCommands.DELETE_FLOW:
          await this.handleDeleteFlow(webview, data);
          break;

        case WebviewOutputCommands.RENAME_FLOW:
          await this.handleRenameFlow(webview, data);
          break;

        default:
          console.warn('[SidebarMessageHandler] Unknown command:', command);
      }
    } catch (error) {
      console.error('[SidebarMessageHandler] Error handling message:', error);
      this.sendError(webview, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle GET_FLOWS command
   */
  private async handleGetFlows(webview: vscode.Webview): Promise<void> {
    const flows = await this.flowService.getFlows();
    webview.postMessage({
      command: WebviewInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle CREATE_FLOW command
   */
  private async handleCreateFlow(webview: vscode.Webview, data?: CreateFlowRequest): Promise<void> {
    const request: CreateFlowRequest = {
      title: data?.title || 'New Flow'
    };

    const flowId = await this.flowService.createFlow(request);
    const flow = await this.flowService.getFlow(flowId);

    if (flow) {
      // Open the flow detail panel
      await this.openFlowDetailsPanel(flowId);

      // Notify webview of the new flow
      webview.postMessage({
        command: WebviewInputCommands.FLOW_LIST_UPDATE,
        data: {
          flows: await this.flowService.getFlows()
        }
      });
    }
  }

  /**
   * Handle OPEN_FLOW_DETAILS command
   */
  private async handleOpenFlowDetails(data: { flowId: string }): Promise<void> {
    await this.openFlowDetailsPanel(data.flowId);
  }

  /**
   * Handle SEARCH_FLOWS command
   */
  private async handleSearchFlows(webview: vscode.Webview, data: { query: string }): Promise<void> {
    const flows = await this.flowService.searchFlows(data.query);
    webview.postMessage({
      command: WebviewInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle DELETE_FLOW command
   */
  private async handleDeleteFlow(webview: vscode.Webview, data: { flowId: string }): Promise<void> {
    await this.flowService.deleteFlow(data.flowId);
    
    // Send updated flow list
    const flows = await this.flowService.getFlows();
    webview.postMessage({
      command: WebviewInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle RENAME_FLOW command
   */
  private async handleRenameFlow(webview: vscode.Webview, data: { flowId: string }): Promise<void> {
    // Get current flow to show current title in input box
    const flow = await this.flowService.getFlow(data.flowId);
    if (!flow) {
      vscode.window.showErrorMessage(`Flow with ID ${data.flowId} not found`);
      return;
    }

    // Show VS Code native input box with current title pre-filled
    const newTitle = await vscode.window.showInputBox({
      prompt: 'Enter new flow title',
      value: flow.title,
      placeHolder: 'My Flow',
      ignoreFocusOut: true,
      validateInput: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Title cannot be empty';
        }
        if (trimmed.length > 100) {
          return 'Title cannot exceed 100 characters';
        }
        return null;
      }
    });

    // User cancelled or provided invalid input
    if (!newTitle) {
      return;
    }

    try {
      // Update flow title
      await this.flowService.updateFlowTitle(data.flowId, newTitle.trim());

      // Send updated flow list to webview
      const flows = await this.flowService.getFlows();
      webview.postMessage({
        command: WebviewInputCommands.FLOW_LIST_UPDATE,
        data: { flows }
      });

      // Update detail panel title if it's open
      const registry = FlowDetailPanelRegistry.getInstance();
      if (registry.isPanelOpen(data.flowId)) {
        const provider = registry.getPanel(data.flowId);
        if (provider) {
          provider.updateTitle(newTitle.trim());
        }
      }
    } catch (error) {
      console.error('[SidebarMessageHandler] Error renaming flow:', error);
      vscode.window.showErrorMessage(
        `Failed to rename flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Open or focus flow detail panel
   */
  private async openFlowDetailsPanel(flowId: string): Promise<void> {
    const registry = FlowDetailPanelRegistry.getInstance();

    // Check if panel already exists
    if (registry.isPanelOpen(flowId)) {
      registry.showPanel(flowId);
      return;
    }

    // Get flow data for panel title
    const flow = await this.flowService.getFlow(flowId);
    if (!flow) {
      vscode.window.showErrorMessage(`Flow with ID ${flowId} not found`);
      return;
    }

    // Create new panel
    const provider = new FlowDetailProvider(this.context, flowId);
    const panel = vscode.window.createWebviewPanel(
      'gonext.flowDetails',
      flow.title,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: this.isDevelopment
          ? []
          : [
              vscode.Uri.joinPath(this.extensionUri, 'dist'),
              vscode.Uri.joinPath(this.extensionUri, 'webviews/flow-detail/dist'),
            ]
      }
    );

    panel.webview.html = provider.getHtmlForWebview(panel.webview);
    provider.setWebviewPanel(panel);
  }

  /**
   * Send error message to webview
   */
  private sendError(webview: vscode.Webview, error: string): void {
    webview.postMessage({
      command: WebviewInputCommands.FLOW_ERROR,
      data: { error }
    });
  }
}
