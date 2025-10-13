import * as vscode from "vscode";
import { debounce } from "lodash";
import { setSidebarMessageListener } from "./messageListener";
import { sidebarMessageSender } from "./messageSender";
import { getWebviewContent } from "../../core/utilities/getWebviewContent";
import { syncFileInfo } from "./outEvents/syncFileInfo";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { inject, injectable } from "inversify";

@injectable()
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _extensionUri: vscode.Uri;
  _disposables: vscode.Disposable[] = [];
  private _isDevelopment: boolean;

  constructor(@inject(INJECTION_KEYS.CONTEXT) context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    // Detect development mode
    this._isDevelopment = process.env.VSCODE_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(
      this._syncFileInfo,
      this,
      this._disposables
    );

    // Listen for text selection changes
    vscode.window.onDidChangeTextEditorSelection(
      this._syncFileInfo,
      this,
      this._disposables
    );

    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(
      this._syncFileInfo,
      this,
      this._disposables
    );
  }

  // Dispose all listeners when extension is deactivated
  public dispose() {
    this._disposables.forEach((d) => d.dispose());
  }

  // Update file information in the sidebar view
  private _syncFileInfo = debounce(() => {
    if (!this._view) {
      return;
    }
    syncFileInfo();
  }, 200);

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

    // Set the HTML content of the webview view
    webviewView.webview.html = this._isDevelopment
      ? this._getDevHtml()
      : getWebviewContent(webviewView.webview, this._extensionUri, 'sidebar');

    // Set up message sender
    sidebarMessageSender.setWebView(webviewView.webview);

    // Set up message listener
    setSidebarMessageListener(webviewView.webview, this._disposables);

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
}