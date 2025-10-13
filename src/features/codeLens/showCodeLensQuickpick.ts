import * as vscode from 'vscode';
import { COMMANDS } from '../../core/constants/commands';
import { getTextRange } from '../../core/utilities/getTextRange';

export async function showCodeLensQuickpick(document: vscode.TextDocument, startPos: vscode.Position, endPos: vscode.Position) {
    const quickPickItems: vscode.QuickPickItem[] = [
        { label: '$(sparkle) Optimize Code', detail: 'Refactor or improve the code automatically' },
        { label: '$(beaker) Write Unit Test', detail: 'Generate a unit test for the function or class' },
        { label: '$(book) Explain Code', detail: 'Summarize and explain what the code does' },
        { label: '$(comment) Add Docstring', detail: 'Insert or update documentation for this item' },
        { label: '$(code) Generate Usage Example', detail: 'Show how to use the class or function' },
    ];

    const selected = await vscode.window.showQuickPick(quickPickItems, {
        title: 'What can GoNext help you with?',
        placeHolder: 'Select an action...',
        matchOnDescription: true,
        ignoreFocusOut: true,
    });

    if (!selected) {
        return;
    }

    // Get context file content
    let prompt = null;
    let preset = null;
    let snippet = getTextRange({ document, startPos, endPos });

    switch (selected.label) {
        case "$(sparkle) Optimize Code":
            prompt = 'Optimize below code';
            preset = 'OptimizeCode';
            break;
        case "$(beaker) Write Unit Test":
            prompt = 'Write Unit Test for below code';
            preset = 'WriteUnitTest';
            break;
        case "$(book) Explain Code":
            prompt = 'Explain below code';
            preset = 'ExplainCode';
            break;
        case "$(comment) Add Docstring":
            prompt = 'Add Docstring for below code';
            preset = 'WriteDoc';
            break;
        case "$(code) Generate Usage Example":
            prompt = 'Generate Usage Example for below code';
            break;
        default:
            vscode.window.showInformationMessage('🧹 Sweeping up some bugs before this feature goes live!');
            return;
    }

    await vscode.commands.executeCommand(COMMANDS.SIDEBAR_NEW_CHAT, { prompt, snippet, preset });
}