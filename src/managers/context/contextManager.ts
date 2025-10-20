import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { EmbeddingManager } from "./embeddingManager";
import { ParserManager } from "./parserManager";
import { QueryManager } from "./queryManager";
import { CodeStructureManager } from "./codeStructureManager";
import { getFilesInWorkspace } from "../../core/utilities/fileUtils";
import { inject } from "inversify";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import type {
  ActionType,
  ActionResult,
  DirectoryEntry,
  DirectoryListing
} from "../../types/flowAnalysisTypes";

export class ContextManager {
  private embeddingManager: EmbeddingManager;
  private parserManager: ParserManager;
  private queryManager: QueryManager;
  private codeStructureManager: CodeStructureManager;
  private watcher: vscode.FileSystemWatcher;

  constructor(
    @inject(INJECTION_KEYS.CONTEXT) private context: vscode.ExtensionContext
  ) {
    this.parserManager = new ParserManager(this.context);
    this.embeddingManager = new EmbeddingManager(this.context);
    this.queryManager = new QueryManager(this.embeddingManager);
    this.codeStructureManager = new CodeStructureManager(this.context);
    this.watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{*}",
      true,
      false,
      true
    );
  }

  public async initialize(): Promise<void> {
    await vscode.window.withProgress(
      {
        title: "GoNext Analyzer",
        location: vscode.ProgressLocation.Window,
        cancellable: false,
      },
      async (progress) => {
        // Initialize parser manager (20%)
        await this.parserManager.initialize(({ message }) => {
          progress.report({ message });
        });

        // Initialize embedding manager (40%)
        await this.embeddingManager.initialize(({ message }) => {
          progress.report({ message });
        });

        // Initialize code structure manager
        await this.codeStructureManager.initialize();

        // Analyze source code (40%)
        const files = await getFilesInWorkspace();
        for (const file of files) {
          const fileName = path.basename(file);
          progress.report({ message: fileName });
          await this.addFile(file);
        }
      }
    );

    // Initialize file watcher for both embedding and code structure
    this.initFileWatcher(this.context);

    // Example query
    // const results = await this.queryRelatedCode('/exam/');
    // console.log(results);
  }

  private initFileWatcher(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.watcher);
    this.watcher.onDidChange(async (uri) => {
      await this.updateFile(uri.fsPath);
      this.codeStructureManager.invalidateCache();
    });
    this.watcher.onDidCreate(async (uri) => {
      await this.addFile(uri.fsPath);
      this.codeStructureManager.invalidateCache();
    });
    this.watcher.onDidDelete(async (uri) => {
      await this.removeFile(uri.fsPath);
      this.codeStructureManager.invalidateCache();
    });
  }

  public async addFile(filePath: string): Promise<void> {
    const chunks = await this.parserManager.parseFile(filePath);
    await this.embeddingManager.addEmbeddings(chunks, filePath);
  }

  public async updateFile(filePath: string): Promise<void> {
    await this.removeFile(filePath);
    await this.addFile(filePath);
  }

  public async removeFile(filePath: string): Promise<void> {
    await this.embeddingManager.removeEmbeddings(filePath);
  }

  public async queryRelatedCode(codeSnippet: string): Promise<any[]> {
    return this.queryManager.query(codeSnippet);
  }

  public async getCurrentFileInfo(): Promise<{
    document: vscode.TextDocument;
    selection: vscode.Selection;
  }> {
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    if (!editor || !document) {
      throw new Error("No active editor or document");
    }
    const selection = editor.selection;

    return { document, selection };
  }

  /**
   * Get the code structure of the current workspace folder.
   * Delegates to CodeStructureManager.
   *
   * @param isFlatten - Whether to return a flattened array of files or nested structure
   * @returns Promise resolving to the directory structure or undefined if no workspace
   */
  public async getCodeStructure(isFlatten: boolean = false): Promise<any> {
    return this.codeStructureManager.getCodeStructure(isFlatten);
  }

  /**
   * Manually refresh the cached code structure.
   * Delegates to CodeStructureManager.
   */
  public async refreshCodeStructure(): Promise<void> {
    return this.codeStructureManager.refreshCodeStructure();
  }

  /**
   * Clear the code structure cache.
   * Delegates to CodeStructureManager.
   */
  public clearCodeStructureCache(): void {
    this.codeStructureManager.clearCodeStructureCache();
  }

  public getFileContent(filePath: string): string {
    try {
      let fullPath: string;

      if (path.isAbsolute(filePath)) {
        fullPath = filePath;
      } else {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('No workspace folder found.');
          return '';
        }
        fullPath = path.join(workspaceFolder.uri.fsPath, filePath);
      }

      const stats = fs.lstatSync(fullPath);

      if (stats.isFile()) {
        return fs.readFileSync(fullPath, 'utf-8');
      } else if (stats.isDirectory()) {
        return '';
      } else {
        vscode.window.showErrorMessage('The path is not a regular file or directory.');
        return '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      vscode.window.showErrorMessage(`Error reading path: ${errorMessage}`);
      return '';
    }
  }

  /**
   * Perform an action during code exploration
   */
  public async performAction(actionType: ActionType, parameters: any): Promise<ActionResult> {
    const timestamp = new Date().toISOString();
    
    try {
      switch (actionType) {
        case 'read_file':
          return await this.performReadFile(parameters.path, timestamp);
        
        case 'search_content':
          return await this.performSearchContent(parameters.query, parameters.scope, timestamp);
        
        case 'read_terminal':
          return await this.performReadTerminal(parameters.command, timestamp);
        
        case 'list_directory':
          return await this.performListDirectory(parameters.path, parameters.recursive || false, timestamp);
        
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        actionType,
        success: false,
        data: null,
        error: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Read file content
   */
  private async performReadFile(filePath: string, timestamp: string): Promise<ActionResult> {
    try {
      // Validate file path
      if (!filePath || filePath.trim().length === 0) {
        throw new Error('File path cannot be empty');
      }

      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
      }

      // Resolve absolute path
      const workspaceRoot = workspaceFolders[0].uri;
      const fileUri = vscode.Uri.joinPath(workspaceRoot, filePath);

      // Read file
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent).toString('utf-8');

      return {
        actionType: 'read_file',
        success: true,
        data: {
          path: filePath,
          content,
          lines: content.split('\n').length,
          size: fileContent.byteLength
        },
        timestamp
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        actionType: 'read_file',
        success: false,
        data: null,
        error: `Failed to read file: ${errorMessage}`,
        timestamp
      };
    }
  }

  /**
   * Search content in codebase using embedding similarity
   */
  private async performSearchContent(query: string, scope: string, timestamp: string): Promise<ActionResult> {
    try {
      // Validate input
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      // Use embedding manager to find similar code
      const results = await this.embeddingManager.findSimilar(query, 10);

      return {
        actionType: 'search_content',
        success: true,
        data: {
          query,
          scope,
          results: results.map(r => ({
            text: r.text,
            similarity: r.similarity,
            file: r.metadata.filePath,
            chunkIndex: r.metadata.chunkIndex
          })),
          totalMatches: results.length
        },
        timestamp
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        actionType: 'search_content',
        success: false,
        data: null,
        error: `Failed to search content: ${errorMessage}`,
        timestamp
      };
    }
  }

  /**
   * Read terminal output by executing a command
   */
  private async performReadTerminal(command: string, timestamp: string): Promise<ActionResult> {
    try {
      // Validate command
      if (!command || command.trim().length === 0) {
        throw new Error('Command cannot be empty');
      }

      // Execute command and capture output
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Get workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;

      // Execute command with timeout
      const { stdout, stderr } = await execAsync(command, {
        cwd: workspaceRoot,
        timeout: 10000, // 10 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      return {
        actionType: 'read_terminal',
        success: true,
        data: {
          command,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          workingDirectory: workspaceRoot
        },
        timestamp
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        actionType: 'read_terminal',
        success: false,
        data: {
          command,
          stdout: error.stdout || '',
          stderr: error.stderr || ''
        },
        error: `Failed to execute command: ${errorMessage}`,
        timestamp
      };
    }
  }

  /**
   * List directory contents
   */
  private async performListDirectory(
    directoryPath: string,
    recursive: boolean = false,
    timestamp: string
  ): Promise<ActionResult> {
    try {
      // Validate directory path
      if (!directoryPath || directoryPath.trim().length === 0) {
        throw new Error('Directory path cannot be empty');
      }

      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
      }

      // Resolve absolute path
      const workspaceRoot = workspaceFolders[0].uri;
      const normalizedPath = directoryPath.trim();
      const dirUri = normalizedPath === '.' ? workspaceRoot : vscode.Uri.joinPath(workspaceRoot, normalizedPath);

      // Read directory contents
      const entries: DirectoryEntry[] = [];
      await this.readDirectoryRecursive(dirUri, normalizedPath, entries, recursive, 0, 3);

      // Count files and directories
      const totalFiles = entries.filter(e => e.type === 'file').length;
      const totalDirectories = entries.filter(e => e.type === 'directory').length;

      const listing: DirectoryListing = {
        path: normalizedPath,
        entries,
        totalFiles,
        totalDirectories
      };

      return {
        actionType: 'list_directory',
        success: true,
        data: listing,
        timestamp
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        actionType: 'list_directory',
        success: false,
        data: null,
        error: `Failed to list directory: ${errorMessage}`,
        timestamp
      };
    }
  }

  /**
   * Helper method to recursively read directory contents
   */
  private async readDirectoryRecursive(
    dirUri: vscode.Uri,
    relativePath: string,
    entries: DirectoryEntry[],
    recursive: boolean,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    // Check depth limit
    if (currentDepth >= maxDepth) {
      return;
    }

    try {
      const dirContents = await vscode.workspace.fs.readDirectory(dirUri);

      for (const [name, fileType] of dirContents) {
        // Skip hidden files and directories
        if (name.startsWith('.')) {
          continue;
        }

        const entryPath = relativePath === '.' ? name : `${relativePath}/${name}`;
        const isDirectory = fileType === vscode.FileType.Directory;

        const entry: DirectoryEntry = {
          name,
          path: entryPath,
          type: isDirectory ? 'directory' : 'file'
        };

        // Detect file language from extension
        if (!isDirectory) {
          const ext = name.split('.').pop();
          if (ext) {
            entry.language = ext;
          }
        }

        entries.push(entry);

        // Recursively read subdirectories if requested
        if (recursive && isDirectory) {
          const subDirUri = vscode.Uri.joinPath(dirUri, name);
          await this.readDirectoryRecursive(
            subDirUri,
            entryPath,
            entries,
            recursive,
            currentDepth + 1,
            maxDepth
          );
        }
      }
    } catch (error) {
      // Silently skip directories that can't be read (e.g., permission issues)
      console.warn(`Could not read directory ${dirUri.fsPath}:`, error);
    }
  }
}
