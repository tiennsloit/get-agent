import * as vscode from "vscode";
import { DiContainer } from "./core/di-container";
import { CommandRegistry } from "./core/commandRegistry";
import { INJECTION_KEYS } from "./core/constants/injectionKeys";
import { ProviderFactory } from "./core/providerFactory";

export async function activate(context: vscode.ExtensionContext) {
  console.log("GoNext extension is now active!");

  // Configure Dedendency Injection Container
  DiContainer.configure(context);

  // Register commands
  const commandRegistry = DiContainer.get<CommandRegistry>(
    INJECTION_KEYS.COMMAND_REGISTRY
  );
  commandRegistry.register(context);

  // Register providers
  const providerFactory = DiContainer.get<ProviderFactory>(
    INJECTION_KEYS.PROVIDER_FACTORY
  );
  providerFactory.register(context);
}

export function deactivate() {}
