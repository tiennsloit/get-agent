import * as vscode from 'vscode';
import { SidebarInputCommands } from "../../../core/constants/sidebar";
import { sidebarMessageSender } from "../messageSender";
import { DiContainer } from '../../../core/di-container';
import { SidebarProvider } from '../sidebarProvider';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';

export async function createNewChat(params?: { title: string, prompt: string }) {
    // Get sidebar provider instance to check that the sidebar is open or not
    const sidebarProvider = DiContainer.get<SidebarProvider>(INJECTION_KEYS.SIDEBAR_PROVIDER);
    const isSidebarVisible = sidebarProvider._view?.visible ?? false;

    if (!isSidebarVisible) {
        // If the sidebar is not visible, open it.
        vscode.commands.executeCommand("workbench.view.extension.gonext-sidebar");

        // Wait for the sidebar to be visible.
        await new Promise((resolve) => {
            sidebarProvider._view?.onDidChangeVisibility(() => {
                if (sidebarProvider._view?.visible) {
                    resolve(null);
                }
            });
        });
    }

    // Get the sidebar message sender instance.
    sidebarMessageSender.post(SidebarInputCommands.NEW_CHAT, params ?? {});
}