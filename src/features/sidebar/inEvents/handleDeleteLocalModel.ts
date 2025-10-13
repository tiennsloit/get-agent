import * as vscode from "vscode";
import { DiContainer } from "../../../core/di-container";
import { INJECTION_KEYS } from "../../../core/constants/injectionKeys";
import { deleteFileOrDirectory } from "../../../core/utilities/deleteFileOrDirectory";
import { configState } from "../../../managers/state/configState";
import { syncAppConfig } from "../outEvents/syncAppConfig";

export async function handleDeleteLocalModel(message: any) {
  const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
  const { model } = message.data;
  const destUri = vscode.Uri.joinPath(context.globalStorageUri, 'models', model.fileName);
  
  await deleteFileOrDirectory(destUri);
  configState.updateModelStatus(model.id, "not-downloaded");
  vscode.window.showInformationMessage("Model deleted successfully!");
  syncAppConfig();
}