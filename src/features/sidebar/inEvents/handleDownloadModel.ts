import * as vscode from "vscode";
import { DiContainer } from "../../../core/di-container";
import { INJECTION_KEYS } from "../../../core/constants/injectionKeys";
import { downloadFile } from "../../../core/utilities/downloadFile";
import { configState } from "../../../managers/state/configState";
import { syncAppConfig } from "../outEvents/syncAppConfig";

export async function handleDownloadModel(message: any) {
  const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
  const { model } = message.data;
  const destUri = vscode.Uri.joinPath(context.globalStorageUri, 'models', model.fileName);

  // Download model
  await vscode.window.withProgress(
    {
      title: "Download " + model.name + "...",
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
    },
    async (progress, token) => {
      // On cancel
      token.onCancellationRequested(() => {
        progress.report({ message: "Download cancelled" });
        configState.updateModelStatus(model.id, "not-downloaded");
        syncAppConfig();
      });

      // Update downloading status and sync app config to webview
      configState.updateModelStatus(model.id, "downloading");
      syncAppConfig();

      // Download file
      await downloadFile(model.downloadUrl, destUri, progress, token);

      // Update downloaded status and sync app config to webview
      configState.updateModelStatus(model.id, "downloaded");
      syncAppConfig();
    }
  );
}