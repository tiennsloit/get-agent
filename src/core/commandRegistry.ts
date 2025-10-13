import * as vscode from 'vscode';
import { COMMANDS } from './constants/commands';
import { generateCommitMessage } from '../features/sourceControl/commitMessageProvider';
import { showCodeLensQuickpick } from '../features/codeLens/showCodeLensQuickpick';
import { showCodeInstructionInput } from '../features/codeCompletion/showCodeInstructionInput';
import { createNewChat } from '../features/sidebar/outEvents/createNewChat';
import { showChatHistory } from '../features/sidebar/outEvents/showChatHistory';
import { showWalkthrough } from '../startup/showWalkthough';
import { generateDocumentation } from '../features/inlineSuggestion/generateDocumentation';
import { acceptSuggestion, rejectSuggestion } from '../features/inlineSuggestion/inlineSuggestionCodeLensAction';
import { showSidebarSettings } from '../features/sidebar/outEvents/showSidebarSettings';
import { explainProblem } from '../features/quickFix/explainProblem';
import { explainCode } from '../features/contextMenu/explainCode';
import { optimizeCode } from '../features/contextMenu/optimizeCode';
import { resetSidebar } from '../features/sidebar/outEvents/resetSidebar';

export class CommandRegistry {
    private readonly _commands: Array<{ id: string, execute(...args: any[]): Promise<any> | unknown }>;
    constructor() {
        this._commands = [
            // Show generate commit message button
            {
                id: COMMANDS.SHOW_GENERATE_COMMIT_BUTTON,
                execute: () => ({
                    command: "gonext.generate-commit-message",
                    title: "$(sparkle)",
                    tooltip: "Generate commit message using AI",
                })
            },

            // Generate commit message based on staged changes
            {
                id: COMMANDS.GENERATE_COMMIT_MESSAGE,
                execute: generateCommitMessage
            },

            // Show code instruction input box
            {
                id: COMMANDS.SHOW_CODE_INSTRUCTION_INPUT,
                execute: showCodeInstructionInput,
            },

            // Show CodeLens quick pick
            {
                id: COMMANDS.SHOW_CODELENS_QUICKPICK,
                execute: showCodeLensQuickpick,
            },

            // Show sidebar panel
            {
                id: COMMANDS.SHOW_SIDEBAR,
                execute: () => vscode.commands.executeCommand("workbench.view.extension.gonext-sidebar"),
            },

            // Show extension settings
            {
                id: COMMANDS.SHOW_SETTINGS,
                execute: () => vscode.commands.executeCommand("workbench.action.openSettings", "@ext:gonext.gonext"),
            },

            // Sidebar Commands
            {
                id: COMMANDS.SIDEBAR_NEW_CHAT,
                execute: createNewChat,
            },
            {
                id: COMMANDS.SIDEBAR_SHOW_HISTORY,
                execute: showChatHistory,
            },
            {
                id: COMMANDS.SIDEBAR_SHOW_SETTINGS,
                execute: showSidebarSettings
            },
            {
                id: COMMANDS.SIDEBAR_RESET,
                execute: resetSidebar,
            },
            {
                id: COMMANDS.SHOW_WALKTHROUGH,
                execute: showWalkthrough,
            },
            {
                id: COMMANDS.INLINE_DOCUMENT,
                execute: generateDocumentation
            },
            {
                id: COMMANDS.INLINE_DOCUMENT_ACCEPT,
                execute: acceptSuggestion
            },
            {
                id: COMMANDS.INLINE_DOCUMENT_REJECT,
                execute: rejectSuggestion
            },
            {
                id: COMMANDS.EXPLAIN_PROBLEM,
                execute: explainProblem
            },
            {
                id: COMMANDS.CONTEXT_MENU_EXPLAIN,
                execute: explainCode
            },
            {
                id: COMMANDS.CONTEXT_MENU_OPTIMIZE,
                execute: optimizeCode
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