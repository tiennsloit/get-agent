import * as vscode from 'vscode';
import { DiContainer } from '../core/di-container';
import { INJECTION_KEYS } from '../core/constants/injectionKeys';
import * as path from 'path';
import * as fs from 'fs';
import { downloadFile } from '../core/utilities/downloadFile';
import { configState } from '../managers/state/configState';
import { syncAppConfig } from '../features/sidebar/outEvents/syncAppConfig';

/**
 * Checks if the local model file exists and if so, checks the config.
 * If the model file does not exist, it shows a notification to the user to download the model.
 */
export async function checkLocalModel(): Promise<void> {
    // Get context from DI
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);

    // Get list of model files
    const isModelExisted = await checkFileExists(context);

    // If model is not downloaded, show notification to ask user to download
    if (!isModelExisted) {
        const isContinue = await downloadModelFile(context);
        if (isContinue) {
            await checkLocalModel();
            syncAppConfig();
        }
        return;
    }
}

async function checkFileExists(context: vscode.ExtensionContext): Promise<boolean> {
    // Check if local model exists
    for (const model of configState.llmModels) {
        const modelPath = path.join(context.globalStorageUri.fsPath, 'models', model.fileName);
        const isExisted = fs.existsSync(modelPath);
        configState.updateModelStatus(model.id, isExisted ? 'downloaded' : 'not-downloaded');
    }

    return configState.llmModels.filter(model => model.status === 'downloaded').length > 0;
}

async function downloadModelFile(context: vscode.ExtensionContext): Promise<boolean> {
    const selection = await vscode.window.showInformationMessage(
        'No free models found. Would you like to download them now?',
        "Download",
        "Later"
    );
    if (selection === "Download") {
        const options = configState.llmModels.map(model => ({
            id: model.id,
            label: model.name,
            description: 'Size: ' + model.fileSize,
            detail: model.description,
        }));

        const selection = await vscode.window.showQuickPick(options, {
            title: 'Which model would you like to download?',
            placeHolder: 'Select a model to download'
        });

        if (selection) {
            const selectedModel = configState.llmModels.find(model => model.id === selection.id)!;
            const destUri = vscode.Uri.joinPath(context.globalStorageUri, 'models', selectedModel.fileName);

            // Download model
            await vscode.window.withProgress(
                {
                    title: "Download " + selectedModel.name + "...",
                    location: vscode.ProgressLocation.Notification,
                    cancellable: true,
                },
                async (progress, token) => {
                    await downloadFile(selectedModel.downloadUrl, destUri, progress, token);
                }
            );
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

