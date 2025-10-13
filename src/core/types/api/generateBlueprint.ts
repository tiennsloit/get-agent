import { RelatedFile } from "./getRelatedFiles";

export interface BlueprintRequest {
    currentFilePath: string;
    currentFileContent: string;
    projectStructure: string;
    relatedFiles: RelatedFile[];
    userRequest: string;
}

export interface BlueprintTask {
    title: string;
    description: string;
    contextFiles: string[];
    files: Array<{
        file: string;
        action: 'edit' | 'add' | 'remove';
    }>;
}

export interface BlueprintResponse {
    title: string;
    description: string;
    related_files: Array<RelatedFile>;
    tasks: Array<BlueprintTask>;
}
