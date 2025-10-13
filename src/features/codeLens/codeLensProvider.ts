import * as vscode from "vscode";
import {
  languagePatterns,
  patternPriorities,
  patterns,
} from "./codeLensConfig";
import { COMMANDS } from "../../core/constants/commands";
import { injectable } from "inversify";
import { codeLensState } from "./codeLensState";

/**
 * A comprehensive CodeLensProvider that identifies classes, functions, and methods
 * across multiple programming languages.
 */
@injectable()
export class CodeLensProvider implements vscode.CodeLensProvider {
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  constructor() {
    codeLensState.addListener((isActive) => {
      if (isActive) {
        this.onDidChangeCodeLensesEmitter.fire();
      }
    });
  }

  /**
   * Provide code lenses for the given document
   */
  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    // Hide CodeLens when state.enabled is false
    if (!codeLensState.enabled) {
      return [];
    }

    // Get language ID from document
    const languageId = document.languageId;

    // Make sure codelens is hidden in comment
    const text = this.removeComments(document.getText(), languageId);
    const allCodeLenses: vscode.CodeLens[] = [];
    const uniquePositionMap = new Map<string, any>();

    // Determine which pattern sets to use
    const patternSets =
      languagePatterns[languageId] || languagePatterns["unknown"];

    // Process each applicable pattern set
    for (const patternSet of patternSets) {
      const pattern = patterns[patternSet];

      // Process each pattern in the set
      for (const [type, regex] of Object.entries(pattern)) {
        // Reset regex lastIndex
        (regex as RegExp).lastIndex = 0;

        let match;
        while ((match = (regex as RegExp).exec(text)) !== null) {
          if (token.isCancellationRequested) {
            break;
          }

          // Determine the position, range, entity name and type
          const startPos = document.positionAt(match.index);
          const endPos = this.findBlockEnd(document, startPos);
          const range = new vscode.Range(startPos, endPos);
          const entityName = match[1] || "anonymous";
          const entityType = type;

          // Create the CodeLens list
          const args = [document, startPos, endPos, entityName, entityType];
          const codeLens = {
            range,
            args,
            hasDocumentation: this.hasDocumentation(document, startPos),
          };

          // Create a position key based on the line number
          const posKey = `line:${startPos.line}`;

          // Check if we already have a CodeLens for this line
          if (
            !uniquePositionMap.has(posKey) ||
            (patternPriorities[type] || 0) >
            (patternPriorities[uniquePositionMap.get(posKey)!.entityType] ||
              0)
          ) {
            uniquePositionMap.set(posKey, codeLens);
          }
        }
      }
    }

    // Add all unique CodeLenses
    for (const {
      range,
      args: [document, startPos, endPos, entityName, entityType],
      hasDocumentation,
    } of uniquePositionMap.values()) {
      allCodeLenses.push(
        new vscode.CodeLens(range, {
          title: "✨GoNext: Ask AI",
          command: COMMANDS.SHOW_CODELENS_QUICKPICK,
          arguments: [document, startPos, endPos, entityName, entityType],
        })
      );
      if (!hasDocumentation) {
        allCodeLenses.push(
          new vscode.CodeLens(range, {
            title: "Document",
            command: COMMANDS.INLINE_DOCUMENT,
            arguments: [document, startPos, endPos, entityName, entityType],
          })
        );
      }
    }

    return allCodeLenses;
  }

  /**
   * Check if there's documentation above the given position
   */
  private hasDocumentation(
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    const lineNumber = position.line;
    if (lineNumber === 0) {
      return false; // No lines above to check
    }

    // Check previous lines for comments
    const languageId = document.languageId;
    let currentLine = lineNumber - 1;

    // Languages with single-line comments
    const singleLineCommentLanguages = [
      "javascript",
      "typescript",
      "javascriptreact",
      "typescriptreact",
      "java",
      "csharp",
      "go",
      "php",
      "rust",
      "swift",
    ];
    // Languages with docstring-style comments
    const docStringLanguages = ["python", "ruby"];

    while (currentLine >= 0) {
      const lineText = document.lineAt(currentLine).text.trim();

      if (lineText === "") {
        currentLine--;
        continue;
      }

      // Check for single-line comments
      if (singleLineCommentLanguages.includes(languageId)) {
        if (
          lineText.startsWith("//") ||
          lineText.startsWith("/*") ||
          lineText.startsWith("*")
        ) {
          return true;
        }
        break; // Non-comment line found
      }
      // Check for Python/Ruby docstrings
      else if (docStringLanguages.includes(languageId)) {
        if (
          lineText.startsWith('"""') ||
          lineText.startsWith("'''") ||
          lineText.startsWith("#")
        ) {
          return true;
        }
        break; // Non-comment line found
      }

      // For other languages, use a generic approach
      if (
        lineText.startsWith("//") ||
        lineText.startsWith("/*") ||
        lineText.startsWith("*") ||
        lineText.startsWith("#") ||
        lineText.startsWith('"""') ||
        lineText.startsWith("'''")
      ) {
        return true;
      }

      break; // Non-comment line found
    }

    return false;
  }

  /**
  * Find the end position of a code block (function, class, etc.)
  */
  private findBlockEnd(document: vscode.TextDocument, startPos: vscode.Position): vscode.Position {
    const text = document.getText();
    let depth = 0;
    let pos = document.offsetAt(startPos);
    let openingBracePos = -1;

    // Find the opening brace of the block
    while (pos < text.length) {
      const char = text[pos];
      if (char === '{') {
        openingBracePos = pos;
        depth = 1;
        pos++;
        break;
      } else if (char === '\n' && text.substr(pos).trim().startsWith(':')) {
        // Handle Python-style blocks with indentation
        return this.findPythonBlockEnd(document, startPos);
      }
      pos++;
    }

    // If we didn't find an opening brace, return the start line's end
    if (openingBracePos === -1) {
      const line = document.lineAt(startPos);
      return line.range.end;
    }

    // Find the matching closing brace
    while (pos < text.length && depth > 0) {
      const char = text[pos];
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      }
      pos++;
    }

    // If we found the closing brace, return its position
    if (depth === 0) {
      return document.positionAt(pos);
    }

    // Fallback: return the end of the document
    return document.positionAt(text.length);
  }

  /**
   * Special handling for Python-style blocks (indentation-based)
   */
  private findPythonBlockEnd(document: vscode.TextDocument, startPos: vscode.Position): vscode.Position {
    const startLine = document.lineAt(startPos);
    const startIndentation = startLine.firstNonWhitespaceCharacterIndex;
    let lineNumber = startPos.line + 1;

    while (lineNumber < document.lineCount) {
      const currentLine = document.lineAt(lineNumber);
      if (currentLine.isEmptyOrWhitespace) {
        lineNumber++;
        continue;
      }

      const currentIndentation = currentLine.firstNonWhitespaceCharacterIndex;
      if (currentIndentation <= startIndentation) {
        // Found a line with same or less indentation - end of block
        return document.lineAt(lineNumber - 1).range.end;
      }
      lineNumber++;
    }

    // If we didn't find the end, return the end of the document
    return document.positionAt(document.getText().length);
  }

  private removeComments(text: string, languageId: string) {
    // For single-line comments, replace content with asterisks while keeping comment markers
    let cleanedText = text
      // Replace content in single-line comments (//) with asterisks
      .replace(/(\/\/)(.*)$/gm, (match, commentMarker, content) => {
        return commentMarker + '*'.repeat(content.length);
      })
      // Replace content in shell-style comments (#) with asterisks
      .replace(/(#)(.*)$/gm, (match, commentMarker, content) => {
        return commentMarker + '*'.repeat(content.length);
      });

    // For multi-line comments, replace content with asterisks while preserving structure
    cleanedText = cleanedText.replace(/(\/\*)[\s\S]*?(\*\/)/g, (match, openMarker, closeMarker) => {
      // Preserve the opening and closing markers
      const contentBetween = match.substring(openMarker.length, match.length - closeMarker.length);
      // Replace each character with an asterisk, but preserve newlines
      const replacedContent = contentBetween.replace(/[^\n\r]/g, '*');
      return openMarker + replacedContent + closeMarker;
    });

    // Language-specific handling
    switch (languageId) {
      case 'python':
        // Handle Python triple quotes (''' and """)
        cleanedText = cleanedText
          .replace(/(''')[\s\S]*?(''')/g, (match, openMarker, closeMarker) => {
            const contentBetween = match.substring(openMarker.length, match.length - closeMarker.length);
            const replacedContent = contentBetween.replace(/[^\n\r]/g, '*');
            return openMarker + replacedContent + closeMarker;
          })
          .replace(/(""")[\s\S]*?(""")/g, (match, openMarker, closeMarker) => {
            const contentBetween = match.substring(openMarker.length, match.length - closeMarker.length);
            const replacedContent = contentBetween.replace(/[^\n\r]/g, '*');
            return openMarker + replacedContent + closeMarker;
          });
        break;
      case 'ruby':
        // Handle Ruby =begin/=end blocks
        cleanedText = cleanedText.replace(/(^=begin\s*)[\s\S]*?(^=end\s*$)/gm, (match, openMarker, closeMarker) => {
          const contentBetween = match.substring(openMarker.length, match.length - closeMarker.length);
          const replacedContent = contentBetween.replace(/[^\n\r]/g, '*');
          return openMarker + replacedContent + closeMarker;
        });
        break;
      case 'html':
      case 'xml':
      case 'vue':
        // Handle HTML comments
        cleanedText = cleanedText.replace(/(<!--)[\s\S]*?(-->)/g, (match, openMarker, closeMarker) => {
          const contentBetween = match.substring(openMarker.length, match.length - closeMarker.length);
          const replacedContent = contentBetween.replace(/[^\n\r]/g, '*');
          return openMarker + replacedContent + closeMarker;
        });
        break;
      case 'sql':
        // Handle SQL comments
        cleanedText = cleanedText.replace(/(--)(.*$)/gm, (match, commentMarker, content) => {
          return commentMarker + '*'.repeat(content.length);
        });
        break;
    }

    return cleanedText;
  }
}

