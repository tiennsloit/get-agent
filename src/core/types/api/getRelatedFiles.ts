export interface RelatedFilesRequest {
    currentFilePath: string;
    currentFileContent: string;
    projectStructure: string;
    userRequest: string;
}

export interface RelatedFile {
    name: string;
    path: string;
    relationship: string;
    confidence: number;
}
