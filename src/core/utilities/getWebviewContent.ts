import * as vscode from "vscode";
import { getUri } from "./getUri";
import { getNonce } from "./getNonce";

/**
 * Defines and returns the HTML that should be rendered within the webview panel.
 *
 * @remarks This is also the place where references to the Vue webview build files
 * are created and inserted into the webview HTML.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  webviewName: string,
) {
  // The CSS file from the Vue build output
  const stylesUri = getUri(webview, extensionUri, [
    "webviews",
    webviewName,
    "dist",
    "assets",
    "index.css",
  ]);
  // The JS file from the Vue build output
  const scriptUri = getUri(webview, extensionUri, [
    "webviews",
    webviewName,
    "dist",
    "assets",
    "index.js",
  ]);

  const nonce = getNonce();

  return getWebviewFrame(webview, stylesUri, scriptUri, nonce);
}

export function getWebviewFrame(
  webview: vscode.Webview,
  stylesUri: vscode.Uri,
  scriptUri: vscode.Uri,
  nonce: string
) {
  return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap" rel="stylesheet">
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="
            default-src 'none';
            img-src ${webview.cspSource} https:;
            script-src ${webview.cspSource} 'self' https://*.vscode-cdn.net 'unsafe-inline';
            style-src ${webview.cspSource} 'unsafe-inline';
            worker-src ${webview.cspSource} 'self';
          ">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>GoNext</title>
        </head>
        <body>
          <div id="app"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
}
