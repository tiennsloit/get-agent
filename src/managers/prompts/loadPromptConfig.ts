import * as vscode from "vscode";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { PromptConfig } from "../../core/types/promptConfig";
import { DiContainer } from "../../core/di-container";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";

export function loadPromptConfig(fileName: string): PromptConfig {
    // Get context instance
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);

    try {
        const filePath = path.join(
            context.extensionPath,
            "assets",
            "prompts",
            fileName
        );
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const config = yaml.load(fileContents) as PromptConfig;
        return config;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
        throw new Error(`Failed to load or parse YAML file: ${errorMessage}`);
    }
}