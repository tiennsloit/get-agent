import * as vscode from 'vscode';

export function getTextRange({ document, startPos, endPos }: { document: vscode.TextDocument, startPos: vscode.Position, endPos: vscode.Position }): string {
    // Create a range from the positions
    const range = new vscode.Range(startPos, endPos);

    if (document) {
        return document.getText(range);
    } else {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw Error('No active editor');
        }

        // Get the text within this range
        return editor.document.getText(range);
    }
}