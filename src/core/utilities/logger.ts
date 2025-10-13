import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

export function initializeLogger(channelName: string = 'Semantic Code Search') {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel(channelName);
    }
}

function log(level: string, message: string, ...optionalParams: any[]) {
    if (!outputChannel) {
        console.warn("Logger not initialized. Using console.", level, message, ...optionalParams);
        return;
    }
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${level.toUpperCase()}] [${timestamp}] ${message}`;
    outputChannel.appendLine(formattedMessage);
    if (optionalParams.length > 0) {
        optionalParams.forEach(param => {
            if (typeof param === 'object') {
                try {
                    outputChannel?.appendLine(JSON.stringify(param, null, 2));
                } catch (e) {
                    outputChannel?.appendLine(`[Could not stringify object: ${e}]`);
                }
            } else {
                outputChannel?.appendLine(String(param));
            }
        });
    }
}

export function logInfo(message: string, ...optionalParams: any[]) {
    log('info', message, ...optionalParams);
}

export function logWarn(message: string, ...optionalParams: any[]) {
    log('warn', message, ...optionalParams);
}

export function logError(message: string, error?: Error | any, ...optionalParams: any[]) {
    log('error', message, ...optionalParams);
    if (error instanceof Error) {
        log('error', `Error details: ${error.message}`);
        if (error.stack) {
            log('error', `Stack trace:\n${error.stack}`);
        }
    } else if (error) {
        log('error', 'Error details:', error);
    }
}

export function showOutput() {
    outputChannel?.show(true);
}
