import { GenerateInlineDocumentInput } from "../../core/types/api";
import { SimplePrompts } from "../../core/types/promptMessage";
import { loadPromptConfig } from "./loadPromptConfig";

export function getGenerateInlineDocumentPrompts({
  target_code,
  entity_name,
  entity_type,
}: GenerateInlineDocumentInput): SimplePrompts {
  const { version, system_prompt, user_prompt } = loadPromptConfig(
    "generate_inline_document.yaml"
  );

  // Check if version is supported
  if (version !== 1) {
    throw new Error("Unsupported prompt version");
  }

  return {
    systemPrompt: {
      role: "system",
      content: system_prompt,
    },
    userPrompt: {
      role: "user",
      content: user_prompt!
        .replace("{{ target_code }}", target_code.toString())
        .replace("{{ entity_name }}", entity_name)
        .replace("{{ entity_type }}", entity_type),
    },
  };
}
