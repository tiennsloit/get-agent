import * as vscode from 'vscode';
import { execSync } from 'child_process';

/**
 * Get original and staged content of a file
 * @param filePath Absolute file path
 * @returns { originalContent: string, changedContent: string } 
 * @throws Error if Git is not available or file is not in Git
 */
export async function getGitDiff(filePath: string): Promise<{
    originalContent: string,
    changedContent: string
}> {
    // Get workspace folder containing the file
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
    if (!workspaceFolder) {
        throw new Error('File is not in a workspace');
    }

    // Get relative path (Git works with relative paths)
    const relativePath = vscode.workspace.asRelativePath(filePath, false);

    try {
        // Get original content (last committed version)
        const originalContent = execSync(
            `git show HEAD:./${relativePath}`,
            { cwd: workspaceFolder.uri.fsPath }
        ).toString();

        // Get staged content (what will be committed)
        // First check if file is staged
        const stagedFiles = execSync(
            'git diff --name-only --cached',
            { cwd: workspaceFolder.uri.fsPath }
        ).toString().split('\n').filter(Boolean);

        const isStaged = stagedFiles.includes(relativePath);

        let changedContent: string;
        if (isStaged) {
            // For staged files, we need to reconstruct the staged version
            // Create a temp index, apply staged changes, then read the file
            const tempIndex = execSync(
                'git write-tree',
                { cwd: workspaceFolder.uri.fsPath }
            ).toString().trim();

            changedContent = execSync(
                `git cat-file -p ${tempIndex}:./${relativePath}`,
                { cwd: workspaceFolder.uri.fsPath }
            ).toString();
        } else {
            // If not staged, current workspace version is what would be committed
            const doc = await vscode.workspace.openTextDocument(filePath);
            changedContent = doc.getText();
        }

        return {
            originalContent,
            changedContent
        };

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Not a git repository')) {
                throw new Error('Not a Git repository');
            }
            if (error.message.includes('exists on disk, but not in')) {
                throw new Error('File is not tracked by Git');
            }
        }
        throw new Error(`Failed to get Git diff: ${error instanceof Error ? error.message : String(error)}`);
    }
}