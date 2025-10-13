import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';
import { SidebarInputCommands } from '../../../core/constants/sidebar';
import { sidebarMessageSender } from '../messageSender';

// Define the type for a node in the project structure
// Using `type` and `interface` to accurately reflect the structure
type NodeType = 'file' | 'directory';

interface ProjectStructureNode {
  name: string;
  path: string;
  type: NodeType;
  language?: string; // Optional for directories or files without a language
  children?: ProjectStructureNode[]; // Optional, only for directories
}

/**
 * Synchronizes the codebase by sending the directory structure to the provided webview.
 *
 * This function checks if there is an open workspace folder, loads .gitignore patterns,
 * retrieves the directory structure recursively, and sends the updated structure to the webview.
 */
export async function syncCodebase() {
    // Get the current code structure
    const structure = await getCodeStructure();

    // Send updated codebase structure to webview
    sidebarMessageSender.post(
        SidebarInputCommands.SYNC_CODEBASE,
        structure,
    );
}

/**
 * Retrieves the directory structure of the current workspace folder.
 *
 * The function first checks if there's an open workspace folder, loads .gitignore patterns,
 * and then retrieves the directory structure recursively. The resulting structure is
 * returned as a JSON object with the following format:
 *
 * {
 *   path: string,
 *   isDirectory: boolean,
 *   children: [
 *     { path: string, isDirectory: boolean, children: [...] },
 *     ...
 *   ]
 * }
 *
 * @returns {Promise<any>} Resolves with the directory structure or undefined if
 *   no workspace folder is open.
 */
export async function getCodeStructure(isFlatten: boolean = false): Promise<any> {
    // Check if there's a workspace folder open
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const workspacePath = workspaceFolder.uri.fsPath;

    // Load .gitignore patterns
    const ignoreFilter = await _loadGitignore(workspacePath);

    // Get directory structure using recursive functions
    const structure = await _getDirectoryStructure(workspacePath, "", ignoreFilter);

    return isFlatten ? flattenProjectStructure(structure) : structure;
}

/**
 * Flattens a nested project structure object into an array of file information.
 *
 * @param node - The current node in the structure (initially the root).
 * @param result - The accumulator array for the flattened results.
 *                     (Internal use, omit when calling initially).
 * @returns An array of objects, each representing a file.
 *          Each object contains 'path' and 'language' properties.
 *          Directories are not included in the final list.
 */
function flattenProjectStructure(
  node: ProjectStructureNode,
  result: { path: string; language: string }[] = []
): { path: string; language: string }[] {
  // Check if the current node represents a file
  if (node.type === 'file') {
    // Add the file's path and language to the result array
    result.push({
      path: node.path,
      // Provide a default if language is missing or undefined
      language: node.language ?? 'unknown',
    });
  }

  // If the node has children, recursively process each child
  // Check for existence and length to be safe
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      flattenProjectStructure(child, result);
    }
  }

  // Return the accumulated result
  return result;
}

async function _loadGitignore(rootPath: string): Promise<any> {
    const ig = ignore();
    const gitignorePath = path.join(rootPath, '.gitignore');

    try {
        // Check if .gitignore exists
        await fs.promises.access(gitignorePath, fs.constants.R_OK);

        // Read and parse .gitignore
        const content = await fs.promises.readFile(gitignorePath, 'utf8');
        ig.add(content);
    } catch (error) {
        // .gitignore doesn't exist or can't be read
        console.log("No .gitignore found or couldn't be read");
    }

    return ig;
}

async function _getDirectoryStructure(
    dirPath: string,
    relativePath = "",
    ignoreFilter: any
): Promise<any> {
    const result: any = {
        name: path.basename(dirPath),
        path: relativePath,
        type: "directory",
        children: [],
    };

    try {
        const entries = await vscode.workspace.fs.readDirectory(
            vscode.Uri.file(dirPath)
        );

        for (const [name, type] of entries) {
            const fullPath = path.join(dirPath, name);
            const childRelativePath = path.join(relativePath, name);

            // Skip node_modules and .git by default (common large directories)
            if (name === 'node_modules' || name === '.git') {
                continue;
            }

            // Check if the path should be ignored according to .gitignore
            if (ignoreFilter && ignoreFilter.ignores(childRelativePath)) {
                continue;
            }

            if (type === vscode.FileType.Directory) {
                const childStructure = await _getDirectoryStructure(
                    fullPath,
                    childRelativePath,
                    ignoreFilter
                );
                result.children.push(childStructure);
            } else {
                result.children.push({
                    name,
                    path: childRelativePath,
                    type: "file",
                    language: path.extname(name).substring(1),
                });
            }
        }
    } catch (error) {
        console.error("Error reading directory:", error);
    }

    return result;
}
