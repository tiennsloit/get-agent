import * as vscode from 'vscode';
import { replaceTextInDocument } from '../../core/utilities/replaceTextInDocument';

function acceptSuggestion(document: vscode.TextDocument, match: string, suggestion: string) {
    replaceTextInDocument(document, `\n${match}\n`, suggestion);
}

function rejectSuggestion(document: vscode.TextDocument, match: string) {
    replaceTextInDocument(document, `\n${match}\n`, '');
}

export { acceptSuggestion, rejectSuggestion };