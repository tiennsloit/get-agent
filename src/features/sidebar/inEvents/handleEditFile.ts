import * as vscode from "vscode";

export async function handleEditFile(message: any) {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const { path: filePath } = message.data;
    const fullPath = vscode.Uri.joinPath(workspaceFolder!.uri, filePath);
    const document = await vscode.workspace.openTextDocument(fullPath);
    await vscode.window.showTextDocument(document);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open file: ${error}`);
  }
}