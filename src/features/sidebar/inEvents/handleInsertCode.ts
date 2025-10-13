import * as vscode from "vscode";

export function handleInsertCode(message: any) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, message.data.code);
    });
  }
}