import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Gets a TextDocument object by file path
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<vscode.TextDocument>} - The opened text document
 */
async function getDocumentByPath(filePath: string): Promise<vscode.TextDocument> {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }

    // Create a URI from the file path
    const uri = vscode.Uri.file(filePath);

    // Check if the document is already open
    for (const doc of vscode.workspace.textDocuments) {
        if (doc.uri.fsPath === uri.fsPath) {
            return doc;
        }
    }

    // If document is not open, open it
    try {
        return await vscode.workspace.openTextDocument(uri);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
        throw new Error(`Failed to open document: ${errorMessage}`);
    }
}

/**
 * Resolves a relative path against the workspace root
 * @param {string} relativePath - Relative path from workspace root
 * @returns {string} - Absolute file path
 */
function resolveWorkspacePath(relativePath: string) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        return path.join(workspaceRoot, relativePath);
    }
    throw new Error('No workspace folder is open');
}

export { getDocumentByPath, resolveWorkspacePath };