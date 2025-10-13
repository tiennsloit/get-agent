import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { sidebarMessageSender } from "../messageSender";
import { SidebarInputCommands } from "../../../core/constants/sidebar";
import { configState } from "../../../managers/state/configState";
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';

/**
 * Sync the app configuration with the webview.
 * This function is called when the user updates extension settings.
 * @internal
 */
export async function syncAppConfig() {
  // Get ext version from package.json
  const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
  const packageJsonPath = vscode.Uri.joinPath(context.extensionUri, 'package.json').fsPath;
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const version: string = packageJson.version;

  // Push app configuration to webview
  sidebarMessageSender.post(SidebarInputCommands.SYNC_CONFIG, {
    version,
    features: configState.features,
    providers: configState.providers,
    llmModels: configState.llmModels,
  });
}
