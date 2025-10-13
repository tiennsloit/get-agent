import * as vscode from "vscode";
import { DiContainer } from "../core/di-container";
import { INJECTION_KEYS } from "../core/constants/injectionKeys";
import { configState } from "../managers/state/configState";
import { compareVersions } from "../core/utilities/version";

/**
 * Performs various checks to ensure that the extension is set up correctly.
 * This includes:
 * - Checking that the state file exists and is up to date
 * - Checking that the current config file is up to date
 * - Checking that the project is embedded
 *
 * This function must be called when the extension is activated.
 */
export async function checkState() {
    // Get context from DI
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);

    // Init the state manager
    configState.onInit(context);

    // Load and parse configuration files
    const configFolder = context.extensionMode === vscode.ExtensionMode.Production ? 'production' : 'development';
    const configFiles = [
        "features.json",
        "local-models.json",
        "providers.json"
    ].map(fileName => vscode.Uri.joinPath(context.extensionUri, "assets", "configurations", configFolder, fileName));

    const [
        features,
        models,
        providers
    ] = await Promise.all(
        configFiles.map(uri =>
            vscode.workspace.fs.readFile(uri).then(buffer => JSON.parse(buffer.toString()))
        )
    );

    // Check that current config file is up to date
    if (compareVersions(features.version, configState.state.features.version) > 0) {
        configState.update({ features });
    }
    if (compareVersions(models.version, configState.state.models.version) > 0) {
        configState.update({ models });
    }
    if (compareVersions(providers.version, configState.state.providers.version) > 0) {
        configState.update({ providers });
    }
}