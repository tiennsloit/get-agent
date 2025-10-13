import * as vscode from 'vscode';
import { CancellationToken, Progress } from 'vscode';

export async function downloadFile(
    fileUrl: string,
    destUri: vscode.Uri,
    progress: Progress<{
        message?: string;
        increment?: number;
    }>,
    token: CancellationToken,
): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            // Dynamically import got
            const gotModule = await import('got');
            const got = gotModule.default;

            const chunks: Buffer[] = [];
            let receivedBytes = 0;
            let totalBytes = 0;
            let cancelled = false;

            const downloadStream = got.stream(fileUrl);

            downloadStream.on('downloadProgress', (progressData: any) => {
                totalBytes = progressData.total || totalBytes;
                const increment = progressData.transferred - receivedBytes;
                receivedBytes = progressData.transferred;
                if (totalBytes) {
                    const percent = (receivedBytes / totalBytes) * 100;
                    progress.report({ increment: (increment / totalBytes) * 100, message: `${percent.toFixed(1)}%` });
                } else {
                    progress.report({ message: `${(receivedBytes / 1024).toFixed(1)} KB downloaded` });
                }
            });

            downloadStream.on('data', (chunk: Buffer) => {
                if (cancelled) {
                    downloadStream.destroy();
                    return;
                }
                chunks.push(chunk);
            });

            downloadStream.on('end', async () => {
                if (cancelled) { return; }
                try {
                    const buffer = Buffer.concat(chunks);
                    await vscode.workspace.fs.writeFile(destUri, buffer);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });

            downloadStream.on('error', (err: any) => {
                reject(err);
            });

            token.onCancellationRequested(() => {
                cancelled = true;
                downloadStream.destroy();
                reject(new Error('Download cancelled'));
            });
        } catch (err) {
            reject(err);
        }
    });
}
