import * as vscode from 'vscode';
import type {
  ActionType,
  ActionResult,
  DirectoryEntry,
  DirectoryListing
} from '../../types/flowAnalysisTypes';

/**
 * Executor for flow-related actions during code exploration
 */
export class FlowActionExecutor {
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
   * Search content in codebase (mocked for now)
   */
  private async performSearchContent(query: string, scope: string, timestamp: string): Promise<ActionResult> {
    try {
      // Validate input
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      // TODO: Using tree-sitter to find matches
      const mockResults = [];

      return {
        actionType: 'search_content',
        success: true,
        data: {
          query,
          scope,
          results: [],
          totalMatches: mockResults.length
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
