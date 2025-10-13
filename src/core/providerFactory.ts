import * as vscode from 'vscode';
import { injectable, inject } from 'inversify';
import { SidebarProvider } from '../features/sidebar/sidebarProvider';
import { INJECTION_KEYS } from './constants/injectionKeys';

@injectable()
export class ProviderFactory {
    private readonly _providers: Map<symbol, any> = new Map();

    constructor(
        @inject(INJECTION_KEYS.SIDEBAR_PROVIDER) sidebarProvider: SidebarProvider,
    ) {
        this._providers.set(INJECTION_KEYS.SIDEBAR_PROVIDER, sidebarProvider);
    }

    // Register all providers
    public register(context: vscode.ExtensionContext) {
        // Register sidebar provider
        const sidebarProvider = this._providers.get(INJECTION_KEYS.SIDEBAR_PROVIDER);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider("gonext.sidebar", sidebarProvider)
        );
    }
}
