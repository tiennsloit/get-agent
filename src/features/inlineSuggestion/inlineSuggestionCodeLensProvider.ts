import * as vscode from 'vscode';
import { getMarkerPattern } from './getMarkerPattern';
import { injectable } from 'inversify';
import { codeLensState } from '../codeLens/codeLensState';
import { COMMANDS } from '../../core/constants/commands';

/**
 * CodeLens provider for GoNext suggestions.
 */
@injectable()
export class InlineSuggestionCodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        const codeLenses = [];
        const text = document.getText();
        const suggestionRegex = getMarkerPattern();

        let match;
        while ((match = suggestionRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const range = new vscode.Range(startPos, startPos);

            // Accept CodeLens
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: '✅ Accept',
                    command: COMMANDS.INLINE_DOCUMENT_ACCEPT,
                    arguments: [document, match[0], match[1]]
                })
            );

            // Reject CodeLens
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: '❌ Reject',
                    command: COMMANDS.INLINE_DOCUMENT_REJECT,
                    arguments: [document, match[0]]
                })
            );
        }

        // Update CodeLens state based on the number of InlineSuggestion CodeLenses        
        if (codeLenses.length > 0) {
            if (!codeLensState.enabled) {
                codeLensState.disable();
            }
        } else {
            if (!codeLensState.enabled) {
                codeLensState.enable();
            }
        }

        return codeLenses;
    }
}