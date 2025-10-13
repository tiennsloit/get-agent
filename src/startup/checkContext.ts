import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { INJECTION_KEYS } from "../core/constants/injectionKeys";
import { DiContainer } from "../core/di-container";
import { ContextManager } from "../managers/context/contextManager";
import { downloadFile } from "../core/utilities/downloadFile";
import { configState } from "../managers/state/configState";

/**
 * Checks if the context model exists and downloads it if it does not.
 * After downloading or if the model already exists, it initializes the context.
 * This function is called when the extension is activated.
 */
export async function checkContext() {
    const embeddingModel = configState.embeddingModel;
    if (!embeddingModel) {
        vscode.window.showErrorMessage('No embedding model found in the config');
        // No embedding model found in config
        return;
    }

    const isModelExisted = await checkFileExists(embeddingModel.fileName);

    if (!isModelExisted) {
        await downloadModelFile();
    }

    // Update state
    configState.updateModelStatus(embeddingModel.id, "downloaded");

    // Init context manager
    await initContextManager();
}

/**
 * Checks if the context model exists in the global storage directory.
 * The model to check is the 'bge-small-en-v1.5.gguf' model.
 * @returns {Promise<boolean>} A boolean indicating whether the model exists.
 */
async function checkFileExists(fileName: string): Promise<boolean> {
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
    const filePath = path.join(context.globalStorageUri.fsPath, 'embedding', fileName);
    const fileExists = fs.existsSync(filePath);
    return fileExists;
}

/**
 * Downloads the embedding model file to the global storage directory.
 * The model file is specified by the `EMBEDDING_MODEL` constant and
 * is fetched from its associated download URL.
 *
 * This function retrieves the extension's global storage URI to determine
 * the destination path for the downloaded file.
 * 
 * @returns {Promise<void>} A promise that resolves when the download is complete.
 */
async function downloadModelFile(): Promise<void> {
    const embeddingModel = configState.embeddingModel;
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
    const destUri = vscode.Uri.joinPath(context.globalStorageUri, 'embedding', embeddingModel!.fileName);
    const fileUrl = embeddingModel!.downloadUrl;

    // Download model
    await vscode.window.withProgress(
        {
            title: "Download embedding model...",
            location: vscode.ProgressLocation.Window,
            cancellable: false,
        },
        async (progress, token) => {
            await downloadFile(fileUrl, destUri, progress, token);
        }
    );
}

/**
 * Initializes the ContextManager for the extension.
 * This function sets up the context manager when the extension is activated 
 * and ensures that it reinitializes whenever there is a change in the workspace folders.
 * It subscribes to the `onDidChangeWorkspaceFolders` event to handle changes in workspace.
 * If a project is already open during activation, the context manager is initialized immediately.
 * The function does not return any value.
 */
async function initContextManager(): Promise<void> {
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
    const contextManager = DiContainer.get<ContextManager>(
        INJECTION_KEYS.CONTEXT_MANAGER
    );

    // If a project is already open on activation
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        contextManager.initialize();
    }

    // Listen for when a folder/workspace is opened after activation
    const disposable = vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            contextManager.initialize();
        }
    });

    context.subscriptions.push(disposable);
}
