import * as vscode from 'vscode';
import * as path from 'path';
import { ContextFile } from '../../../core/types/activeFile';
import { sidebarMessageSender } from '../messageSender';
import { SidebarInputCommands } from '../../../core/constants/sidebar';

/**
 * Synchronizes the file information of the currently active editor with the provided webview.
 *
 * This function collects various details about the currently active text editor, such as the file name,
 * language, content, cursor position, and selection details. It then sends this information to the specified
 * webview via a postMessage call.
 */
export function syncFileInfo() {
    // Retrieve file information
    const fileInfo = getFileInfo();

    // Send the file information to the webview
    sidebarMessageSender.post(
        SidebarInputCommands.SYNC_FILE_INFO,
        fileInfo,
    );
};

export function getFileInfo(): ContextFile | undefined {
    // Check if there's an active editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    // Get active editor info
    const document = editor.document;
    const selection = editor.selection;

    // Prepare the file information to send
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const filePath = workspaceFolder
        ? path.relative(workspaceFolder.uri.fsPath, document.uri.fsPath)
        : document.uri.fsPath;

    const fileInfo: ContextFile = {
        fileName: document.fileName,
        baseName: document.fileName.split("/").pop() || document.fileName,
        language: document.languageId,
        content: document.getText(),
        cursorPosition: {
            line: selection.active.line,
            character: selection.active.character,
        },
        selection: {
            text: document.getText(selection),
            startLine: selection.start.line,
            endLine: selection.end.line,
            startCharacter: selection.start.character,
            endCharacter: selection.end.character,
        },
        lineCount: document.lineCount,
        filePath,
    };

    return fileInfo;
}