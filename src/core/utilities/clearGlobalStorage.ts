import * as vscode from 'vscode';
import { DiContainer } from '../di-container';
import { INJECTION_KEYS } from '../constants/injectionKeys';
/**
 * Clears the entire global storage directory and its contents.
 * This includes all models, codebases, and other data stored by the extension.
 * After clearing the storage, the directory is recreated so it's available for future use.
 * A status message is shown to the user after the operation is complete.
 */

export async function clearGlobalStorage(): Promise<void> {
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
    try {
        // Remove the entire global storage directory and its contents
        await vscode.workspace.fs.delete(context.globalStorageUri, { recursive: true, useTrash: false });
        // Recreate the directory so it's available for future use
        await vscode.workspace.fs.createDirectory(context.globalStorageUri);
        vscode.window.showInformationMessage('Global storage cleared.');
    } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to clear global storage: ${err.message}`);
    }
}
