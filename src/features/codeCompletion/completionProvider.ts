import * as vscode from "vscode";
import { inject, injectable } from "inversify";
import { GoNextService } from "../../services";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { DiContainer } from "../../core/di-container";

@injectable()
export class CompletionProvider
  implements vscode.CompletionItemProvider, vscode.Disposable {
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceTime: number = 3000; // Changed to 3 seconds
  private canProvideCompletion: boolean = false;
  private textChangeDisposable: vscode.Disposable;
  private lastTriggerTime: number = 0;
  private triggerCooldown: number = 100; // 100ms cooldown to prevent rapid triggers

  /* Placeholder */
  private placeholderDecorationType: vscode.TextEditorDecorationType;
  // Track if user is actively editing
  private isEditing = false;
  private editingTimeout: NodeJS.Timeout | undefined;
  private hasActiveSuggestions = false;

  /* End placeholder */

  constructor(
    @inject(INJECTION_KEYS.CONTEXT) context: vscode.ExtensionContext
  ) {
    const isMac = process.platform === "darwin";
    const shortcutKey = isMac ? "Cmd+I" : "Ctrl+I";
    const placeholderText = `Press ${shortcutKey} to enter instructions...`;

    // Create decoration type for placeholder
    this.placeholderDecorationType =
      vscode.window.createTextEditorDecorationType({
        after: {
          contentText: placeholderText,
          color: "#999999",
          fontStyle: "italic",
          margin: "0 0 0 20px",
        },
        isWholeLine: true,
      });
    this.initPlaceholderDecoration(context);

    // Set up text change listener with debouncing
    this.textChangeDisposable = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        console.log(`[${new Date().toISOString()}] Text changed detected`);
        if (this.debounceTimer) {
          console.log(`[${new Date().toISOString()}] Clearing previous timer`);
          clearTimeout(this.debounceTimer);
        }
        this.canProvideCompletion = false;
        this.debounceTimer = setTimeout(() => {
          console.log(
            `[${new Date().toISOString()}] 3-second debounce period elapsed`
          );
          this.canProvideCompletion = true;
          const editor = vscode.window.activeTextEditor;
          if (editor && event.document === editor.document) {
            const now = Date.now();
            if (now - this.lastTriggerTime < this.triggerCooldown) {
              console.log(
                `[${new Date().toISOString()}] Trigger skipped due to cooldown`
              );
              return;
            }
            this.lastTriggerTime = now;
            const position = editor.selection.active;
            console.log(
              `[${new Date().toISOString()}] Triggering suggestion at line ${position.line
              }, character ${position.character}`
            );
            editor.selection = new vscode.Selection(position, position);
            Promise.resolve(
              vscode.commands.executeCommand("editor.action.triggerSuggest")
            ).catch((err) => {
              console.error(
                `[${new Date().toISOString()}] Error triggering suggestion:`,
                err
              );
            });
          } else {
            console.log(
              `[${new Date().toISOString()}] No active editor, skipping suggestion`
            );
          }
        }, this.debounceTime);
        console.log(`[${new Date().toISOString()}] Timer set for 3 seconds`);
      }
    );
  }

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    console.log(
      `[${new Date().toISOString()}] Completion provider invoked, canProvideCompletion: ${this.canProvideCompletion
      }`
    );
    if (!this.canProvideCompletion) {
      console.log(
        `[${new Date().toISOString()}] Completion provider invoked but not ready, skipping`
      );
      return [];
    }
    this.canProvideCompletion = false; // Reset immediately to block subsequent calls
    console.log(
      `[${new Date().toISOString()}] Providing completion after 3-second debounce`
    );
    const language = document.languageId;
    const text = document.getText();
    const offset = document.offsetAt(position);
    const prefix = text.substring(0, offset);
    // Commented out to avoid confusion
    // console.log(`[${new Date().toISOString()}] Document language: ${language}, prefix: "${prefix}"`);
    const service = DiContainer.get<GoNextService>(
      INJECTION_KEYS.GONEXT_SERVICE
    );
    const completionText = await service.getCompletion(prefix, language);
    if (!completionText) {
      console.log(`[${new Date().toISOString()}] No completion available`);
      return [];
    }
    console.log(
      `[${new Date().toISOString()}] Offering completion: "${completionText}"`
    );
    const completion = new vscode.CompletionItem(
      completionText,
      vscode.CompletionItemKind.Snippet
    );
    completion.insertText = completionText;
    completion.range = new vscode.Range(position, position);
    return [completion];
  }

  public dispose() {
    this.textChangeDisposable.dispose();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  /**
   * Initialize the placeholder decoration. This method is responsible for
   * applying the placeholder decoration to the active editor, and updating the
   * decoration when the active editor changes, the text changes, or the user
   * makes a selection.
   * @param context The extension context.
   */
  initPlaceholderDecoration(context: vscode.ExtensionContext) {
    // Apply decoration to active editor
    this.updatePlaceholderDecoration();

    // Update decoration when active editor changes
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(
        this.updatePlaceholderDecoration
      )
    );

    // Update decoration when text changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && event.document === activeEditor.document) {
          // Mark as editing to hide placeholder temporarily
          this.isEditing = true;

          // Clear any existing timeout
          if (this.editingTimeout) {
            clearTimeout(this.editingTimeout);
          }

          // Reset editing state after a delay
          this.editingTimeout = setTimeout(() => {
            this.isEditing = false;
            this.updatePlaceholderDecoration();
          }, 1500); // 1.5 seconds after typing stops

          // Hide placeholder immediately while editing
          activeEditor.setDecorations(this.placeholderDecorationType, []);
        }
      })
    );

    // Update decoration when editor selections change
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection(() => {
        this.updatePlaceholderDecoration();
      })
    );
  }

  updatePlaceholderDecoration() {
    try {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor || !this || this.isEditing || this.hasActiveSuggestions) {
        return;
      }

      const document = activeEditor.document;
      const decorations: vscode.DecorationOptions[] = [];

      // Check if document is completely empty
      if (document.getText().trim().length === 0) {
        // Show placeholder at the first line for empty documents
        const firstLine = document.lineAt(0);
        const range = new vscode.Range(
          firstLine.range.start,
          firstLine.range.end
        );

        decorations.push({ range });
      } else {
        // For non-empty documents, check cursor positions and selections
        activeEditor.selections.forEach((selection) => {
          // Show placeholder when text is selected
          if (!selection.isEmpty) {
            const range = new vscode.Range(selection.end, selection.end);
            decorations.push({ range });
            return;
          }

          // Handle cursor position cases
          const position = selection.active;
          const line = document.lineAt(position.line);

          // Add placeholder for empty lines
          if (line.text.trim().length === 0) {
            const range = new vscode.Range(line.range.start, line.range.end);
            decorations.push({ range });
          }
          // Add placeholder when cursor is at the end of a non-empty line
          else if (
            position.character === line.text.length &&
            line.text.trim().length > 0
          ) {
            const range = new vscode.Range(position, position);
            decorations.push({ range });
          }
        });
      }

      activeEditor.setDecorations(this.placeholderDecorationType, decorations);
    } catch (err) {
      console.log(err);
    }
  }
}
