import { PromptMessage, SimplePrompts } from "../../core/types/promptMessage";
import { loadPromptConfig } from "./loadPromptConfig";
import { GenerateCodeWithInstructionInput } from "../../core/types/api/generateCodeWithInstruction";

export function getGenerateCodeWithInstructionPrompts({ code_file, target_code, user_instructions }: GenerateCodeWithInstructionInput): SimplePrompts {
    const { version, system_prompt, user_prompt } = loadPromptConfig('generate_code_with_instruction.yaml');

    // Check if version is supported
    if (version !== 1) {
        throw new Error('Unsupported prompt version');
    }

    return {
        systemPrompt: {
            role: 'system',
            content: system_prompt.replace('{{ code_file }}', code_file)
                .replace('{{ target_code }}', target_code.toString())
        },
        userPrompt: {
            role: 'user',
            content: user_prompt?.replace('{{ user_instructions }}', user_instructions) ?? user_instructions
        }
    };
}
