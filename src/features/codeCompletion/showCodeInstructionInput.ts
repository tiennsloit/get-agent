import * as vscode from 'vscode';
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { DiContainer } from "../../core/di-container";
import { GoNextService } from "../../services";
import { getTextRange } from '../../core/utilities/getTextRange';
import { COMMANDS } from '../../core/constants/commands';

export async function showCodeInstructionInput() {
    // Set title
    const title = 'Generate code with instruction';

    // Show input box for instruction
    const prompt = await vscode.window.showInputBox({
        placeHolder: `Enter your instruction...`,
        prompt: "GoNext will generate a code suggestion based on your instruction",
    });

    if (!prompt) {
        return; // User cancelled
    }


    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
    }

    // Get context file content
    const document = editor.document;
    let snippet = null;
    const { start: startPos, end: endPos } = editor.selection;
    if (startPos !== endPos) {
        snippet = getTextRange({ document, startPos, endPos });
    }

    // Open sidebar
    await vscode.commands.executeCommand(COMMANDS.SIDEBAR_NEW_CHAT, { title, prompt, snippet });
}