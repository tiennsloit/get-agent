import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { EmbeddingManager } from "./embeddingManager";
import { ParserManager } from "./parserManager";
import { QueryManager } from "./queryManager";
import { getFilesInWorkspace } from "../../core/utilities/fileUtils";
import { inject } from "inversify";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";

export class ContextManager {
  private embeddingManager: EmbeddingManager;
  private parserManager: ParserManager;
  private queryManager: QueryManager;
  private watcher: vscode.FileSystemWatcher;

  constructor(
    @inject(INJECTION_KEYS.CONTEXT) private context: vscode.ExtensionContext
  ) {
    this.parserManager = new ParserManager(this.context);
    this.embeddingManager = new EmbeddingManager(this.context);
    this.queryManager = new QueryManager(this.embeddingManager);
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

        // Analyze source code (40%)
        const files = await getFilesInWorkspace();
        for (const file of files) {
          const fileName = path.basename(file);
          progress.report({ message: fileName });
          await this.addFile(file);
        }
      }
    );

    // Initialize file watcher
    this.initFileWatcher(this.context);

    // Example query
    // const results = await this.queryRelatedCode('/exam/');
    // console.log(results);
  }

  private initFileWatcher(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.watcher);
    this.watcher.onDidChange(async (uri) => await this.updateFile(uri.fsPath));
    this.watcher.onDidCreate(async (uri) => await this.addFile(uri.fsPath));
    this.watcher.onDidDelete(async (uri) => await this.removeFile(uri.fsPath));
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
}
