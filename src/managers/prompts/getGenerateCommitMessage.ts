import { PromptMessage, SimplePrompts } from "../../core/types/promptMessage";
import { loadPromptConfig } from "./loadPromptConfig";

/**
 * Returns an array of prompts for generating commit messages.
 *
 * @param fileChanges An array of file changes, where each file change is an object with the following properties:
 *   - `fileName`: The file name.
 *   - `languageId`: The language of the file.
 *   - `originalContent`: The original content of the file.
 *   - `changedContent`: The changed content of the file.
 */
export function getGenerateCommitMessage(
  fileChanges: Array<{
    fileName: string;
    languageId: string;
    originalContent: string;
    changedContent: string;
  }>
): SimplePrompts {
  const { version, system_prompt } =
    loadPromptConfig("generate_commit_message.yaml");

  // Check if version is supported
  if (version !== 1) {
    throw new Error("Unsupported prompt version");
  }

  return {
    systemPrompt: {
      role: "system",
      content: system_prompt.replace(
        "{{ file_changes }}",
        JSON.stringify(fileChanges)
      ),
    }
  };
}
