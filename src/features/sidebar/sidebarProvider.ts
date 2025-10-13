import * as vscode from "vscode";
import { getWebviewContent } from "../../core/utilities/getWebviewContent";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { inject, injectable } from "inversify";
import { FlowService } from "../../services/flowService";
import { FlowDetailProvider } from "../flow/flowDetailProvider";
import { FlowDetailPanelRegistry } from "../flow/flowDetailPanelRegistry";
import { SidebarOutputCommands, SidebarInputCommands } from "../../core/constants/sidebar";
import type { CreateFlowRequest } from "../../types/flowState";

@injectable()
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _extensionUri: vscode.Uri;
  _disposables: vscode.Disposable[] = [];
  private _isDevelopment: boolean;

  constructor(
    @inject(INJECTION_KEYS.CONTEXT) private context: vscode.ExtensionContext,
    @inject(INJECTION_KEYS.FLOW_SERVICE) private flowService: FlowService
  ) {
    this._extensionUri = context.extensionUri;
    // Detect development mode
    this._isDevelopment = process.env.VSCODE_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
  }

  // Dispose all listeners when extension is deactivated
  public dispose() {
    this._disposables.forEach((d) => d.dispose());
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    // Set the webview view
    this._view = webviewView;

    // Setup webview configuration
    webviewView.webview.options = {
      enableScripts: true,
      // Allow external URLs in development, restrict to dist in production
      localResourceRoots: this._isDevelopment
        ? []
        : [
            vscode.Uri.joinPath(this._extensionUri, 'dist'),
            vscode.Uri.joinPath(this._extensionUri, 'webviews/sidebar/dist'),
          ],
    };

    // Set the HTML content of the webview view - Flow management UI
    webviewView.webview.html = this._isDevelopment
      ? this._getDevHtml()
      : getWebviewContent(webviewView.webview, this._extensionUri, 'sidebar');

    // Setup message handling
    this._setupMessageHandling(webviewView.webview);

    // Show the webview
    webviewView.show();
  }

  private _getDevHtml(): string {
    // Load Vite's dev server assets directly in development
    return `
      <!DOCTYPE html>
      <html lang="">
      <head>
        <script type="module" src="http://localhost:5173/@id/virtual:vue-devtools-path:overlay.js"></script>
        <script type="module" src="http://localhost:5173/@id/virtual:vue-inspector-path:load.js"></script>
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <meta charset="UTF-8">
        <link rel="icon" href="http://localhost:5173/favicon.ico">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GoNext Sidebar Webview</title>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
          #app { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="app"></div>
        <script type="module" src="http://localhost:5173/src/main.ts"></script>
      </body>
      </html>
    `;
  }

  /**
   * Setup message handling between webview and extension
   */
  private _setupMessageHandling(webview: vscode.Webview): void {
    const messageDisposable = webview.onDidReceiveMessage(
      async (message) => {
        const { command, data } = message;

        try {
          switch (command) {
            case SidebarOutputCommands.GET_FLOWS:
              await this._handleGetFlows(webview);
              break;

            case SidebarOutputCommands.CREATE_FLOW:
              await this._handleCreateFlow(webview, data);
              break;

            case SidebarOutputCommands.OPEN_FLOW_DETAILS:
              await this._handleOpenFlowDetails(data);
              break;

            case SidebarOutputCommands.SEARCH_FLOWS:
              await this._handleSearchFlows(webview, data);
              break;

            case SidebarOutputCommands.DELETE_FLOW:
              await this._handleDeleteFlow(webview, data);
              break;

            case SidebarOutputCommands.RENAME_FLOW:
              await this._handleRenameFlow(webview, data);
              break;

            default:
              console.warn('[SidebarProvider] Unknown command:', command);
          }
        } catch (error) {
          console.error('[SidebarProvider] Error handling message:', error);
          this._sendError(webview, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    );

    this._disposables.push(messageDisposable);
  }

  /**
   * Handle GET_FLOWS command
   */
  private async _handleGetFlows(webview: vscode.Webview): Promise<void> {
    const flows = await this.flowService.getFlows();
    webview.postMessage({
      command: SidebarInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle CREATE_FLOW command
   */
  private async _handleCreateFlow(webview: vscode.Webview, data?: CreateFlowRequest): Promise<void> {
    const request: CreateFlowRequest = {
      title: data?.title || 'New Flow'
    };

    const flowId = await this.flowService.createFlow(request);
    const flow = await this.flowService.getFlow(flowId);

    if (flow) {
      // Open the flow detail panel
      await this._openFlowDetailsPanel(flowId);

      // Notify webview of the new flow
      webview.postMessage({
        command: SidebarInputCommands.FLOW_LIST_UPDATE,
        data: {
          flows: await this.flowService.getFlows()
        }
      });
    }
  }

  /**
   * Handle OPEN_FLOW_DETAILS command
   */
  private async _handleOpenFlowDetails(data: { flowId: string }): Promise<void> {
    await this._openFlowDetailsPanel(data.flowId);
  }

  /**
   * Handle SEARCH_FLOWS command
   */
  private async _handleSearchFlows(webview: vscode.Webview, data: { query: string }): Promise<void> {
    const flows = await this.flowService.searchFlows(data.query);
    webview.postMessage({
      command: SidebarInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle DELETE_FLOW command
   */
  private async _handleDeleteFlow(webview: vscode.Webview, data: { flowId: string }): Promise<void> {
    await this.flowService.deleteFlow(data.flowId);
    
    // Send updated flow list
    const flows = await this.flowService.getFlows();
    webview.postMessage({
      command: SidebarInputCommands.FLOW_LIST_UPDATE,
      data: { flows }
    });
  }

  /**
   * Handle RENAME_FLOW command
   */
  private async _handleRenameFlow(webview: vscode.Webview, data: { flowId: string }): Promise<void> {
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
        command: SidebarInputCommands.FLOW_LIST_UPDATE,
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
      console.error('[SidebarProvider] Error renaming flow:', error);
      vscode.window.showErrorMessage(
        `Failed to rename flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Open or focus flow detail panel
   */
  private async _openFlowDetailsPanel(flowId: string): Promise<void> {
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
        localResourceRoots: this._isDevelopment
          ? []
          : [
              vscode.Uri.joinPath(this._extensionUri, 'dist'),
              vscode.Uri.joinPath(this._extensionUri, 'webviews/flow-detail/dist'),
            ]
      }
    );

    panel.webview.html = provider.getHtmlForWebview(panel.webview);
    provider.setWebviewPanel(panel);
  }

  /**
   * Send error message to webview
   */
  private _sendError(webview: vscode.Webview, error: string): void {
    webview.postMessage({
      command: SidebarInputCommands.FLOW_ERROR,
      data: { error }
    });
  }
}