import { PromptMessage, SimplePrompts } from "../../core/types/promptMessage";
import { loadPromptConfig } from "./loadPromptConfig";

export function getConversationSummarizerPrompts(messages: Array<PromptMessage>): SimplePrompts {
  const { version, system_prompt } = loadPromptConfig(
    "conversation_summarizer.yaml"
  );

  // Check if version is supported
  if (version !== 1) {
    throw new Error("Unsupported prompt version");
  }

  return {
    systemPrompt: {
      role: "system",
      content: system_prompt.replace("{{ conversation }}", JSON.stringify(messages)),
    }
  };
}
