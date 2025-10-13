import * as vscode from "vscode";

export async function replaceTextInDocument(
  document: vscode.TextDocument,
  originalText: string,
  replaceText: string
) {
  // Make sure the document is open
  const trimmedOriginalText = originalText.trim();
  const trimmedReplaceText = replaceText.trim();
  await vscode.window.showTextDocument(document);
  const fullText = document.getText();
  const matchIndex = fullText.indexOf(trimmedOriginalText);

  if (matchIndex === -1) {
    return;
  }

  const edit = new vscode.WorkspaceEdit();

  if (replaceText) {
    const startPos = document.positionAt(matchIndex);
    const endPos = document.positionAt(matchIndex + trimmedOriginalText.length);
    edit.replace(
      document.uri,
      new vscode.Range(startPos, endPos),
      trimmedReplaceText
    );
  } else {
    const startPos = document.positionAt(matchIndex - 1);
    const endPos = document.positionAt(matchIndex + trimmedOriginalText.length);
    edit.delete(document.uri, new vscode.Range(startPos, endPos));
  }

  await vscode.workspace.applyEdit(edit);
}
