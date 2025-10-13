import * as vscode from 'vscode';

export async function getTerminal(): Promise<vscode.Terminal> {
    // Get the active terminal
    let terminal = vscode.window.activeTerminal;

    // If no terminal exists, create a new one
    if (!terminal) {
        terminal = vscode.window.createTerminal();
        terminal.show();
    }

    return terminal;
}
