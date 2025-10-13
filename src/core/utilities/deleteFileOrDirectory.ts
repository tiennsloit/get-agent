import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * Deletes the file or directory specified by the provided URI.
 * If the file/directory does not exist, returns true.
 * @param uri The URI of the file or directory to delete
 * @returns A boolean indicating whether the file/directory was successfully deleted
 */
export async function deleteFileOrDirectory(uri: vscode.Uri): Promise<boolean> {
    const filePath = uri.fsPath;

    try {
        if (!fs.existsSync(filePath)) {
            return true;
        }

        const stat = await fs.promises.lstat(filePath);
        if (stat.isDirectory()) {
            await fs.promises.rm(filePath, { recursive: true, force: true });
        } else {
            await fs.promises.unlink(filePath);
        }
        return true;
    } catch (error) {
        return false;
    }
}
