import * as vscode from "vscode";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { inject } from "inversify";
import { getMarkerPattern } from "./getMarkerPattern";

export class InlineSuggestionDecoration {
  // Decoration type for the green background
  private suggestionDecoration: vscode.TextEditorDecorationType;

  // Track active editor and update decorations
  private activeEditor: vscode.TextEditor | undefined;

  constructor(@inject(INJECTION_KEYS.CONTEXT) context: vscode.ExtensionContext) {
    this.activeEditor = vscode.window.activeTextEditor;
    this.suggestionDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(0, 255, 0, 0.1)', // Slightly green background
      isWholeLine: true
    });


    // Update decorations when the active editor changes
    vscode.window.onDidChangeActiveTextEditor(
      editor => {
        this.activeEditor = editor;
        if (editor) {
          this.updateDecorations();
        }
      },
      null,
      context.subscriptions
    );

    // Update decorations when the text document changes
    vscode.workspace.onDidChangeTextDocument(
      event => {
        if (this.activeEditor && event.document === this.activeEditor.document) {
          this.updateDecorations();
        }
      },
      null,
      context.subscriptions
    );
  }

  // Initial decoration update
  public init() {
    if (this.activeEditor) {
      this.updateDecorations();
    }
  }

  private updateDecorations() {
    if (!this.activeEditor) {
      return;
    }

    const text = this.activeEditor.document.getText();
    const decorations = [];
    const suggestionRegex = getMarkerPattern();

    let match;
    while ((match = suggestionRegex.exec(text)) !== null) {
      const startPos = this.activeEditor.document.positionAt(match.index);
      const endPos = this.activeEditor.document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);
      decorations.push({ range });
    }

    this.activeEditor.setDecorations(this.suggestionDecoration, decorations);
  }
}
