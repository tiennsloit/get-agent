import * as vscode from "vscode";
import { getWebviewContent } from "../../core/utilities/getWebviewContent";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { inject, injectable } from "inversify";
import { FlowService } from "../../services/flowService";
import { FlowStateManager } from "../flow/flowStateManager";
import { SidebarMessageHandler } from "./sidebarMessageHandler";

@injectable()
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _extensionUri: vscode.Uri;
  _disposables: vscode.Disposable[] = [];
  private _isDevelopment: boolean;
  private messageHandler: SidebarMessageHandler;

  constructor(
    @inject(INJECTION_KEYS.CONTEXT) private context: vscode.ExtensionContext,
    @inject(INJECTION_KEYS.FLOW_SERVICE) private flowService: FlowService,
    @inject(INJECTION_KEYS.FLOW_STATE_MANAGER) private flowStateManager: FlowStateManager
  ) {
    this._extensionUri = context.extensionUri;
    // Detect development mode
    this._isDevelopment = process.env.VSCODE_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
    
    // Validate that flowStateManager is properly initialized
    if (!this.flowStateManager) {
      throw new Error('FlowStateManager is not properly injected');
    }
    
    // Initialize message handler
    this.messageHandler = new SidebarMessageHandler({
      context: this.context,
      flowService: this.flowService,
      flowStateManager: this.flowStateManager,
      extensionUri: this._extensionUri,
      isDevelopment: this._isDevelopment
    });
  }

  // Dispose all listeners when extension is deactivated
  public dispose() {
    this.messageHandler.dispose();
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

    // Set webview in message handler to enable event subscriptions
    this.messageHandler.setWebview(webviewView.webview);

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
        await this.messageHandler.handleMessage(webview, message);
      }
    );

    this._disposables.push(messageDisposable);
  }
}