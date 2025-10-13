import * as vscode from "vscode";

export const showWalkthrough = async () => {
    // Show walkthrough
    await vscode.commands.executeCommand('workbench.action.openWalkthrough', 'gonext.gonext#gonext-intro', false);
};
