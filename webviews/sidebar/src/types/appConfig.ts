export interface FeatureConfig {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    disablable: boolean;
    model?: string;
}

export interface LocalModelConfig {
    id: string;
    type: string;
    fileName: string;
    fileSize: number;
    name: string;
    description: string;
    downloadUrl: string;
    status: string;
}

export interface ProviderConfig {
    id: string;
    name: string;
    configuration?: {
        apiUrl: string;
        apiKey: string;
    };
    models: Array<ModelConfig>;
}

export interface ModelConfig {
    enabled?: boolean;
    id: string;
    owned_by: string;
    object: string;
    name?: string;
}

export interface AppConfig {
    version: string;
    features: Array<FeatureConfig>;
    providers: Array<ProviderConfig>;
    llmModels: Array<LocalModelConfig>;
}
