export type PromptMessage =
    | SystemPromptMessage
    | UserPromptMessage
    | AssistantPromptMessage
    | ToolPromptMessage;

export interface SystemPromptMessage {
    content: string;
    role: 'system';
    name?: string;
}

export interface UserPromptMessage {
    content: string;
    role: 'user';
    name?: string;
}

export interface AssistantPromptMessage {
    content: string;
    role: 'assistant';
    name?: string;
}

export interface ToolPromptMessage {
    content: string;
    role: 'tool';
    name?: string;
}

export interface SimplePrompts {
    systemPrompt: SystemPromptMessage;
    userPrompt?: UserPromptMessage;
    assistantPrompt?: AssistantPromptMessage;
    toolPrompt?: ToolPromptMessage;
}