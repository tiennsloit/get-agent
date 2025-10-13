export interface ContextFile {
    fileName: string;
    baseName: string;
    language: string;
    content?: string;
    cursorPosition?: {
        line: number;
        character: number;
    };
    selection?: {
        text: string;
        startLine: number;
        endLine: number;
        startCharacter: number;
        endCharacter: number;
    };
    lineCount: number;
    filePath: string;
}