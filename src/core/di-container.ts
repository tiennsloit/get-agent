import * as vscode from "vscode";
import { Container } from "inversify";
import { CommandRegistry } from "./commandRegistry";
import { INJECTION_KEYS } from "./constants/injectionKeys";
import { ProviderFactory } from "./providerFactory";
import { GoNextService } from "../services";
import { SidebarProvider } from "../features/sidebar/sidebarProvider";
import { CodeLensProvider } from "../features/codeLens/codeLensProvider";
import { InlineSuggestionCodeLensProvider } from "../features/inlineSuggestion/inlineSuggestionCodeLensProvider";
import { ContextManager } from "../managers/context/contextManager";
import { CompletionProvider } from "../features/codeCompletion/completionProvider";
import { QuickFixProvider } from "../features/quickFix/quickFixProvider";
import { FlowExecutor } from "../features/flow/flowExecutor";
import { FlowService } from "../services/flowService";
import { AIClient } from "../services/aiClient";
import { FlowStateManager } from "../features/flow/flowStateManager";

export class DiContainer {
  private static _container: Container;

  // Configure the container with bindings for services.
  public static configure(context: vscode.ExtensionContext): void {
    // Initialize container if not already initialized
    if (!this._container) {
      this._container = new Container();
    }

    // Bind context
    this._container
      .bind<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT)
      .toConstantValue(context);
    // Bind providers
    this._container
      .bind<SidebarProvider>(INJECTION_KEYS.SIDEBAR_PROVIDER)
      .to(SidebarProvider)
      .inSingletonScope();
    this._container
      .bind<CodeLensProvider>(INJECTION_KEYS.CODE_LENS_PROVIDER)
      .to(CodeLensProvider)
      .inSingletonScope();
    this._container
      .bind<CompletionProvider>(INJECTION_KEYS.COMPLETION_PROVIDER)
      .to(CompletionProvider)
      .inSingletonScope();
    this._container
      .bind<InlineSuggestionCodeLensProvider>(
        INJECTION_KEYS.INLINE_SUGGESTION_CODE_LENS_PROVIDER
      )
      .to(InlineSuggestionCodeLensProvider)
      .inSingletonScope();
    this._container
      .bind<QuickFixProvider>(INJECTION_KEYS.QUICK_FIX_PROVIDER)
      .to(QuickFixProvider)
      .inSingletonScope();

    // Bind services and other dependencies.
    this._container
      .bind<CommandRegistry>(INJECTION_KEYS.COMMAND_REGISTRY)
      .to(CommandRegistry)
      .inSingletonScope();
    this._container
      .bind<ProviderFactory>(INJECTION_KEYS.PROVIDER_FACTORY)
      .to(ProviderFactory)
      .inSingletonScope();
    this._container
      .bind<ContextManager>(INJECTION_KEYS.CONTEXT_MANAGER)
      .to(ContextManager)
      .inSingletonScope();
    this._container
      .bind<GoNextService>(INJECTION_KEYS.GONEXT_SERVICE)
      .to(GoNextService)
      .inSingletonScope();
    this._container
      .bind<AIClient>(INJECTION_KEYS.AI_CLIENT)
      .to(AIClient)
      .inSingletonScope();

    // Bind Flow services
    this._container
      .bind<FlowStateManager>(INJECTION_KEYS.FLOW_STATE_MANAGER)
      .toDynamicValue((context) => {
        const vsCodeContext = context.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
        return FlowStateManager.getInstance(vsCodeContext);
      })
      .inSingletonScope();
    this._container
      .bind<FlowExecutor>(INJECTION_KEYS.FLOW_EXECUTOR)
      .toDynamicValue((context) => {
        const flowStateManager = context.get<FlowStateManager>(INJECTION_KEYS.FLOW_STATE_MANAGER);
        return new FlowExecutor(flowStateManager);
      })
      .inSingletonScope();
    this._container
      .bind<FlowService>(INJECTION_KEYS.FLOW_SERVICE)
      .to(FlowService)
      .inSingletonScope();
  }

  // Get an instance of a service by its identifier.
  public static get<T>(identifier: symbol): T {
    try {
      return this._container.get<T>(identifier);
    } catch (error) {
      console.error("Failed to get service:", error);
      throw error;
    }
  }
}