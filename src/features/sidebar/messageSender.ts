import * as vscode from "vscode";

class SidebarMessageSender {
    private webview: vscode.Webview | undefined;

    // Set the webview for sending messages
    setWebView(webview: vscode.Webview) {
        this.webview = webview;
    }

    // Post message to webview
    post(command: string, data: any) {
        if (!this.webview) { return; }
        this.webview.postMessage({ command, data });
    }
}

export const sidebarMessageSender = new SidebarMessageSender();