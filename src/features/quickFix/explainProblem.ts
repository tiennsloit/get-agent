import * as vscode from 'vscode';
import { COMMANDS } from '../../core/constants/commands';
import { getTextRange } from '../../core/utilities/getTextRange';

export async function explainProblem(document: vscode.TextDocument, diagnostic: vscode.Diagnostic) {
    const preset = "DebugError";
    const title = "Debug error: " + diagnostic.message;
    const prompt = `Debug the error ${diagnostic.message} in range ${diagnostic.range.start.line}:${diagnostic.range.start.character} - ${diagnostic.range.end.line}:${diagnostic.range.end.character}`;
    const snippet = getTextRange({ document, startPos: diagnostic.range.start, endPos: diagnostic.range.end });
    await vscode.commands.executeCommand(COMMANDS.SIDEBAR_NEW_CHAT, { title, prompt, snippet, preset });
}