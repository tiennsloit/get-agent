import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';

// Define the type for a node in the project structure
type NodeType = 'file' | 'directory';

interface ProjectStructureNode {
    name: string;
    path: string;
    type: NodeType;
    language?: string; // Optional for directories or files without a language
    children?: ProjectStructureNode[]; // Optional, only for directories
}

/**
 * CodeStructureManager - Manages code structure with caching and auto-update functionality.
 * 
 * This manager provides:
 * - Cached code structure retrieval
 * - Automatic updates when files/directories are added/removed/moved
 * - Support for both nested and flattened structure formats
 * - Integration with .gitignore patterns
 */
export class CodeStructureManager {
    private cache: ProjectStructureNode | null = null;
    private flatCache: { path: string; language: string }[] | null = null;
    private workspacePath: string | null = null;
    private ignoreFilter: any = null;
    private isInitialized = false;

    constructor(private context: vscode.ExtensionContext) {
        // Initialize on construction
        this.initializeAsync();
    }

    /**
     * Initialize the manager asynchronously
     */
    private async initializeAsync(): Promise<void> {
        await this.initialize();
    }

    /**
     * Initialize code structure functionality
     */
    public async initialize(): Promise<void> {
        if (!vscode.workspace.workspaceFolders) {
            return;
        }
        
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const currentWorkspacePath = workspaceFolder.uri.fsPath;
        
        this.workspacePath = currentWorkspacePath;
        this.ignoreFilter = await this.loadGitignore(currentWorkspacePath);
        this.isInitialized = true;
    }

    /**
     * Get the code structure of the current workspace folder.
     * Uses cache if available, otherwise builds the structure and caches it.
     *
     * @param isFlatten - Whether to return a flattened array of files or nested structure
     * @returns Promise resolving to the directory structure or undefined if no workspace
     */
    public async getCodeStructure(isFlatten: boolean = false): Promise<any> {
        // Check if there's a workspace folder open
        if (!vscode.workspace.workspaceFolders) {
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const currentWorkspacePath = workspaceFolder.uri.fsPath;

        // Check if workspace has changed
        if (this.workspacePath !== currentWorkspacePath) {
            await this.initialize();
        }

        // Return cached result if available
        if (isFlatten) {
            if (this.flatCache) {
                return this.flatCache;
            }
        } else {
            if (this.cache) {
                return this.cache;
            }
        }

        // Build structure and cache it
        await this.refreshCodeStructure();

        return isFlatten ? this.flatCache : this.cache;
    }

    /**
     * Manually refresh the cached code structure
     */
    public async refreshCodeStructure(): Promise<void> {
        if (!this.workspacePath) {
            return;
        }

        // Build new structure
        const structure = await this.getDirectoryStructure(this.workspacePath, "", this.ignoreFilter);
        
        // Update caches
        this.cache = structure;
        this.flatCache = structure ? this.flattenProjectStructure(structure) : null;
    }

    /**
     * Clear the code structure cache
     */
    public clearCodeStructureCache(): void {
        this.cache = null;
        this.flatCache = null;
    }

    /**
     * Invalidate code structure cache when file system changes are detected
     */
    public invalidateCache(): void {
        this.clearCodeStructureCache();
    }

    /**
     * Load .gitignore patterns
     */
    private async loadGitignore(rootPath: string): Promise<any> {
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

    /**
     * Get directory structure recursively
     */
    private async getDirectoryStructure(
        dirPath: string,
        relativePath = "",
        ignoreFilter: any
    ): Promise<ProjectStructureNode> {
        const result: ProjectStructureNode = {
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
                    const childStructure = await this.getDirectoryStructure(
                        fullPath,
                        childRelativePath,
                        ignoreFilter
                    );
                    result.children!.push(childStructure);
                } else {
                    result.children!.push({
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

    /**
     * Flatten project structure into array of file information
     */
    private flattenProjectStructure(
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
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                this.flattenProjectStructure(child, result);
            }
        }

        // Return the accumulated result
        return result;
    }
}