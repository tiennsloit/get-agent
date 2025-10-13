import * as vscode from 'vscode';
import { COMMANDS } from '../../core/constants/commands';

export async function explainCode() {
    // Get the currently selected text
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selection = editor.selection;
        const snippet = editor.document.getText(selection);

        const preset = "ExplainCode";
        const prompt = `Explain the following code:`;
        await vscode.commands.executeCommand(COMMANDS.SIDEBAR_NEW_CHAT, { prompt, snippet, preset });
    }
}