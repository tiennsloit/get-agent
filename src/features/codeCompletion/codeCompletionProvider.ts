import * as vscode from "vscode";
import { DiContainer } from "../../core/di-container";
import { GoNextService } from "../../services";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { inject, injectable } from "inversify";

@injectable()
export class InlineCompletionItemProvider
  implements vscode.InlineCompletionItemProvider {

  // Decoration type for placeholder text
  private placeholderDecorationType: vscode.TextEditorDecorationType;

  // Track if user is actively editing
  private isEditing = false;
  private editingTimeout: NodeJS.Timeout | undefined;

  // Track if we have active suggestions
  private hasActiveSuggestions = false;
  private suggestionTimeout: NodeJS.Timeout | undefined;

  constructor(@inject(INJECTION_KEYS.CONTEXT) context: vscode.ExtensionContext) {
    // Determine if running on macOS
    const isMac = process.platform === "darwin";
    const shortcutKey = isMac ? "Cmd+I" : "Ctrl+I";
    const placeholderText = `Press ${shortcutKey} to enter instructions...`;

    // Create decoration type for placeholder
    this.placeholderDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: placeholderText,
        color: "#999999",
        fontStyle: "italic",
        margin: "0 0 0 20px",
      },
      isWholeLine: true,
    });

    this.initPlaceholderDecoration(context);
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
      vscode.window.onDidChangeActiveTextEditor(this.updatePlaceholderDecoration)
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
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || this.isEditing || this.hasActiveSuggestions) {
      return;
    }


    const document = activeEditor.document;
    const decorations: vscode.DecorationOptions[] = [];

    // Check if document is completely empty
    if (document.getText().trim().length === 0) {
      // Show placeholder at the first line for empty documents
      const firstLine = document.lineAt(0);
      const range = new vscode.Range(firstLine.range.start, firstLine.range.end);

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
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    // Hide placeholder when completion is triggered
    this.hasActiveSuggestions = true;
    this.clearPlaceholder();

    // Clear any existing suggestion timeout
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    // Don't provide suggestions while the user is still typing quickly
    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
      // Wait a moment to see if the user is still typing
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (token.isCancellationRequested) {
        this.resetSuggestionsState();
        return null;
      }
    }

    try {
      const service = DiContainer.get<GoNextService>(INJECTION_KEYS.GONEXT_SERVICE);
      const code = document.getText();
      // Convert cursor position to an offset (0-based index in the full text)
      const cursorOffset = document.offsetAt(position);
      // Mark the cursor position
      const markedCode =
        code.slice(0, cursorOffset) +
        '<CURSOR>' +
        code.slice(cursorOffset);

      const suggestion = await service.getAutocompleteSuggestion({ code_file: markedCode });

      if (!suggestion || token.isCancellationRequested) {
        this.resetSuggestionsState();
        return null;
      }

      // Strictly enforce 1-2 line response
      const cleanSuggestion = suggestion
        .split('\n')
        .slice(0, 2)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');


      // Create inline completion item
      const item = new vscode.InlineCompletionItem(
        cleanSuggestion ?? '',
        new vscode.Range(position, position)
      );

      return [item];
    } catch (e) {
      console.error(e);
      this.resetSuggestionsState();
      return null;
    }
  }

  private clearPlaceholder() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      activeEditor.setDecorations(this.placeholderDecorationType, []);
    }
  }

  private resetSuggestionsState() {
    this.hasActiveSuggestions = false;
    this.updatePlaceholderDecoration();
  }
}