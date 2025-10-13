import { SimplePrompts } from "../../core/types/promptMessage";
import { AutocompletionInput } from "../../core/types/api";
import { loadPromptConfig } from "./loadPromptConfig";

/**
 * Returns an array of prompts for autocomplete requests.
 *
 * @param input The code completion input.
 * @returns An array of prompts for the AI to process.
 */
export function getAutocompletePrompts({ code_file }: AutocompletionInput): SimplePrompts {
    const { version, system_prompt } = loadPromptConfig('autocomplete.yaml');

    // Check if version is supported
    if (version !== 1) {
        throw new Error('Unsupported prompt version');
    }

    return {
        systemPrompt: {
            role: 'system',
            content: system_prompt
        },
        userPrompt: {
            role: 'user',
            content: code_file
        }
    };
}
