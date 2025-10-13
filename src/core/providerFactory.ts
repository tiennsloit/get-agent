import * as vscode from 'vscode';
import { injectable, inject } from 'inversify';
import { SidebarProvider } from '../features/sidebar/sidebarProvider';
import { CodeLensProvider } from '../features/codeLens/codeLensProvider';
import { INJECTION_KEYS } from './constants/injectionKeys';
import { supportedLanguages } from '../features/codeLens/codeLensConfig';
import { InlineSuggestionCodeLensProvider } from '../features/inlineSuggestion/inlineSuggestionCodeLensProvider';
import { InlineSuggestionDecoration } from '../features/inlineSuggestion/inlineSuggestionDecoration';
import { CompletionProvider } from '../features/codeCompletion/completionProvider';
import { QuickFixProvider } from '../features/quickFix/quickFixProvider';

@injectable()
export class ProviderFactory {
    private readonly _providers: Map<symbol, any> = new Map();

    constructor(
        @inject(INJECTION_KEYS.SIDEBAR_PROVIDER) sidebarProvider: SidebarProvider,
        @inject(INJECTION_KEYS.CODE_LENS_PROVIDER) codeLensProvider: CodeLensProvider,
        @inject(INJECTION_KEYS.INLINE_SUGGESTION_CODE_LENS_PROVIDER) inlineSuggestionCodeLensProvider: InlineSuggestionCodeLensProvider,
        @inject(INJECTION_KEYS.COMPLETION_PROVIDER) completionItemProvider: CompletionProvider,
        @inject(INJECTION_KEYS.QUICK_FIX_PROVIDER) quickFixProvider: QuickFixProvider,

    ) {
        this._providers.set(INJECTION_KEYS.SIDEBAR_PROVIDER, sidebarProvider);
        this._providers.set(INJECTION_KEYS.CODE_LENS_PROVIDER, codeLensProvider);
        this._providers.set(INJECTION_KEYS.COMPLETION_PROVIDER, completionItemProvider);
        this._providers.set(INJECTION_KEYS.INLINE_SUGGESTION_CODE_LENS_PROVIDER, inlineSuggestionCodeLensProvider);
        this._providers.set(INJECTION_KEYS.QUICK_FIX_PROVIDER, quickFixProvider);
    }

    // Register all providers
    public register(context: vscode.ExtensionContext) {
        // Register sidebar provider
        const sidebarProvider = this._providers.get(INJECTION_KEYS.SIDEBAR_PROVIDER);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider("gonext.sidebar", sidebarProvider)
        );

        // Register code lens provider
        const codeLensProvider = this._providers.get(INJECTION_KEYS.CODE_LENS_PROVIDER);
        supportedLanguages.map(language => {
            context.subscriptions.push(
                vscode.languages.registerCodeLensProvider({ language, scheme: "file" }, codeLensProvider)
            );
        });

        // Register inline completion item provider
        const completionProvider = this._providers.get(INJECTION_KEYS.COMPLETION_PROVIDER);
        const providerDisposable = vscode.languages.registerCompletionItemProvider(
            ['typescript', 'python'],
            completionProvider);

        context.subscriptions.push(providerDisposable, completionProvider);

        // Register inline suggestion (codelens and decoration)
        const inlineSuggestionCodeLensProvider = this._providers.get(INJECTION_KEYS.INLINE_SUGGESTION_CODE_LENS_PROVIDER);
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider({ scheme: "file" }, inlineSuggestionCodeLensProvider)
        );
        const inlineSuggestionDecoration = new InlineSuggestionDecoration(context);
        inlineSuggestionDecoration.init();

        // Register Quick fix provider
        const quickFixProvider = this._providers.get(INJECTION_KEYS.QUICK_FIX_PROVIDER);
        const provider = vscode.languages.registerCodeActionsProvider(
            { scheme: 'file' },
            quickFixProvider,
            {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            }
        );
        context.subscriptions.push(provider);
    }
}
