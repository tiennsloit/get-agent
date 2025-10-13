export interface RelatedFile {
    name: string;
    path: string;
    relationship: string;
    confidence: number;
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
