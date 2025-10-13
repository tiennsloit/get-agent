import * as vscode from "vscode";
import { CODELENS_SUGGESTION_MARKERS } from "../../core/constants/codeLens";
import { GoNextService } from "../../services";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { DiContainer } from "../../core/di-container";
import { getTextRange } from "../../core/utilities/getTextRange";
import { codeLensState } from "../codeLens/codeLensState";
import { configState } from "../../managers/state/configState";
import { COMMANDS } from "../../core/constants/commands";

export const generateDocumentation = async (
  document: vscode.TextDocument,
  startPos: vscode.Position,
  endPos: vscode.Position,
  entityName: string,
  entityType: string,
) => {
  // Check that there is an active editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // Check that this feature is enabled
  const feat = configState.getFeature("codeCompletion");
  if (!feat || !feat.enabled) {
    const selected = await vscode.window.showInformationMessage("This feature is disabled. You can enable it in the settings", "Settings", "Cancel");
    if (selected === "Settings") {
      await vscode.commands.executeCommand(COMMANDS.SHOW_SIDEBAR);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await vscode.commands.executeCommand(COMMANDS.SIDEBAR_SHOW_SETTINGS, { session: 'features' });
    }
    return;
  }

  try {
    // Get Service instance
    const service = DiContainer.get<GoNextService>(INJECTION_KEYS.GONEXT_SERVICE);

    // Disable CodeLens
    codeLensState.disable();

    // Determine the comment style based on language
    const documentText = await service.getInlineDocumentSuggestion({
      code_file: document.getText(),
      target_code: getTextRange({ document, startPos, endPos }),
      entity_name: entityName,
      entity_type: entityType,
    });

    if (!documentText || !documentText.trim()) {
      throw Error("Failed to generate documentation");
    }

    const suggestionText = `${CODELENS_SUGGESTION_MARKERS.START}\n${documentText}\n${CODELENS_SUGGESTION_MARKERS.END}\n`;

    // Insert the suggestion
    await editor!.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(startPos.line, 0), suggestionText);
    });

    return true;
  } catch (err) {
    codeLensState.enable();
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    vscode.window.showErrorMessage("Error: " + errorMessage);
    return false;
  }
};
