interface PromptParameter {
    name: string;
    type: string;
    description: string;
    optional?: boolean;
}

interface PromptConfig {
    name: string;
    version: number;
    model: string;
    system_prompt: string;
    assistant_prompt?: string;
    user_prompt?: string;
    parameters: PromptParameter[];
    output_format: string;
}

export {
    PromptParameter,
    PromptConfig,
};