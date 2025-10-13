export interface ActiveFileInfo {
    fileName: string;
    baseName: string;
    language: string;
    content: string;
    cursorPosition: {
        line: number;
        character: number;
    };
    selection: {
        text: string;
        startLine: number;
        endLine: number;
        startCharacter: number;
        endCharacter: number;
    };
    lineCount: number;
}

export interface CodeStructure {
    name: string;
    path: string;
    type: "file" | "directory";
    language: string;
    children: CodeStructure[];
}

export interface ContextState {
    activeFile: ActiveFileInfo | null;
    codebase: CodeStructure | null;
}
