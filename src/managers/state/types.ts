export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  disablable: boolean;
  model: string;
}

export interface LocalModelConfig {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  name: string;
  description: string;
  downloadUrl: string;
  status: 'downloading' | 'downloaded' | 'not-downloaded';
}

export interface ProviderConfig {
  id: string;
  name: string;
  configuration?: {
    apiUrl: string;
    apiKey: string;
  };
  models: Array<{
    name: string;
    enabled: boolean;
    id: string;
  }>;
}



export interface ExtensionState {
  features: { version: string; values: Array<FeatureConfig> };
  providers: { version: string; values: Array<ProviderConfig> };
  models: { 
    version: string; 
    values: { 
      llm: Array<LocalModelConfig>, 
      embedding: LocalModelConfig | null 
    } 
  };
}
