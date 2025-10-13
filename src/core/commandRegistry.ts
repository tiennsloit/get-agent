import * as vscode from 'vscode';
import { COMMANDS } from './constants/commands';

export class CommandRegistry {
    private readonly _commands: Array<{ id: string, execute(...args: any[]): Promise<any> | unknown }>;
    constructor() {
        this._commands = [
            // Show sidebar panel
            {
                id: COMMANDS.SHOW_SIDEBAR,
                execute: () => vscode.commands.executeCommand("workbench.view.extension.gonext-sidebar"),
            },

            // Show walkthrough
            {
                id: COMMANDS.SHOW_WALKTHROUGH,
                execute: () => vscode.commands.executeCommand('workbench.action.openWalkthrough', 'gonext.gonext#gonext-intro'),
            },
        ];
    }

    // Register all the commands with VS Code.
    public register(context: vscode.ExtensionContext) {
        for (const command of this._commands) {
            context.subscriptions.push(
                vscode.commands.registerCommand(
                    command.id,
                    command.execute.bind(command)
                )
            );
        }
    }
}