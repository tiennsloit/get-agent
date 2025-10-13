import * as vscode from "vscode";

export function getDocumentLine(document: vscode.TextDocument, snippet: string): number | null {
    const text = document.getText();
    const lines = text.split('\n');
    const regex = new RegExp(snippet);

    for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
            return i;
        }
    }

    return null;
}