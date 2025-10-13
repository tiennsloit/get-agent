const vscode = require('vscode');

interface StagedFile {
    path: string;
    status: string
}

/**
 * Gets a list of all staged files in the Git repository
 * @returns {Promise<Array<{path: string, status: string}>>} - Array of staged files with paths and statuses
 */
async function getStagedFiles(): Promise<Array<StagedFile>> {
    // Get Git API
    const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
    const git = gitExtension.getAPI(1);

    if (!git) {
        throw new Error('Git extension not found or not enabled.');
    }

    if (git.repositories.length === 0) {
        throw new Error('No Git repositories found in the workspace.');
    }

    // Get the first repository (you could loop through all if needed)
    const repo = git.repositories[0];

    // Get all staged changes
    const stagedChanges = repo.state.indexChanges;

    // Format the results
    return stagedChanges.map((change: any) => ({
        path: change.uri.fsPath,
        status: change.status
    }));
}

export { StagedFile, getStagedFiles };