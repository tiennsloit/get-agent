import * as vscode from 'vscode';
import { COMMANDS } from '../../core/constants/commands';

export class QuickFixProvider implements vscode.CodeActionProvider {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        // Check if there are diagnostics (errors/warnings)
        for (const diagnostic of context.diagnostics) {
            // Create a quick fix for each diagnostic you want to handle
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                const action = new vscode.CodeAction(
                    'GoNext: Explain Problem',
                    vscode.CodeActionKind.QuickFix
                );

                action.diagnostics = [diagnostic];
                action.isPreferred = true;
                action.command = {
                    title: 'GoNext: Explain Problem',
                    command: COMMANDS.EXPLAIN_PROBLEM,
                    arguments: [document, diagnostic]
                };

                actions.push(action);
            }
        }

        return actions;
    }
}
