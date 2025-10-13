import * as vscode from "vscode";
import { getStagedFiles } from "./getStagedFiles";
import { getGitDiff } from "./getGitDiff";
import { getDocumentByPath } from "../../core/utilities/getDocumentByPath";
import { GoNextService } from "../../services";
import { DiContainer } from "../../core/di-container";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import { configState } from "../../managers/state/configState";
import { COMMANDS } from "../../core/constants/commands";

export async function generateCommitMessage() {
  // Check that the feature is enabled
  const feat = configState.getFeature("commitMessageSuggestion");
  if (!feat || !feat.enabled) {
    const selected = await vscode.window.showInformationMessage("This feature is disabled. You can enable it in the settings", "Settings", "Cancel");
    if (selected === "Settings") {
      await vscode.commands.executeCommand(COMMANDS.SHOW_SIDEBAR);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await vscode.commands.executeCommand(COMMANDS.SIDEBAR_SHOW_SETTINGS, { session: 'features' });
    }
    return;
  }

  // Get Service instance
  const service = DiContainer.get<GoNextService>(INJECTION_KEYS.GONEXT_SERVICE);
  const stagedFileChanges: Array<{ fileName: string, languageId: string, originalContent: string, changedContent: string }> = [];

  const stagedFiles = await getStagedFiles();

  // If there are no staged files, return
  if (stagedFiles.length === 0) {
    vscode.window.showInformationMessage("No staged files found");
    return;
  }

  for (let { path: filePath } of stagedFiles) {
    try {
      const { originalContent, changedContent } = await getGitDiff(filePath);
      const { fileName, languageId } = await getDocumentByPath(filePath);

      stagedFileChanges.push({ fileName, languageId, originalContent, changedContent });
    } catch (e) { }
  }

  // Get suggestion commit message
  const commitMessage = await service.getCommitMessage(stagedFileChanges);


  // Get the git extension
  const gitExtension =
    vscode.extensions.getExtension("vscode.git")?.exports;

  // Check if the Git extension is available
  if (gitExtension) {
    const git = gitExtension.getAPI(1);
    if (git) {
      const repo = git.repositories[0];
      if (repo) {
        repo.inputBox.value = commitMessage;
      }
    }
  }
}
