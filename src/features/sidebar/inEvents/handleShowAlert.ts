import * as vscode from "vscode";

export function handleShowAlert(message: any) {
  vscode.window.showInformationMessage(message.data.message);
}