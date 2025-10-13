import * as vscode from "vscode";
import OpenAI from "openai";
import { PromptMessage } from "../core/types/promptMessage";
import {
  getAutocompletePrompts,
  getGenerateInlineDocumentPrompts,
} from "../managers/prompts";
import {
  AutocompletionInput,
  GenerateInlineDocumentInput,
} from "../core/types/api";
import { DiContainer } from "../core/di-container";
import { INJECTION_KEYS } from "../core/constants/injectionKeys";
import { ContextManager } from "../managers/context/contextManager";
import { getGenerateCommitMessage } from "../managers/prompts/getGenerateCommitMessage";
import { StreamResponseChunk } from "../core/types/chatChunk";
import { PromptPreset } from "../core/types/chatPreset";
import { TextSummarizer } from "../core/utilities/textSummarizer";
import { getConversationSummarizerPrompts } from "../managers/prompts/getConversationSummarizerPrompts";
import { AIClient } from "./aiClient";
import { configState } from "../managers/state/configState";

export class GoNextService {
  private aiClient: AIClient;

  constructor() {
    this.aiClient = new AIClient();
    // TODO: Move host name to config
  }

  // Get model list
  async getModels(
    apiUrl: string,
    apiKey: string
  ): Promise<OpenAI.Models.Model[]> {
    return this.aiClient.getModels(apiUrl, apiKey);
  }

  // Get commit message
  async getCommitMessage(
    fileChanges: Array<{
      fileName: string;
      languageId: string;
      originalContent: string;
      changedContent: string;
    }>
  ): Promise<string | null> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "GoNext: Generating commit message...",
        cancellable: true,
      },
      async (_, token) => {
        try {
          // Handle cancel action
          token.onCancellationRequested(() => {
            this.aiClient.stopStream();
            vscode.window.showInformationMessage("Operation cancelled by user");
            return null;
          });

          const { systemPrompt } = getGenerateCommitMessage(fileChanges);
          const feat = configState.getFeature(
            "commitMessageSuggestion"
          );
          if (!feat) {
            throw new Error("Feature not found");
          }
          return this.aiClient.getCompletion(
            feat.model,
            [systemPrompt],
            {
              maxTokens: 100,
            }
          );
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unexpected error";
          vscode.window.showErrorMessage("Error: " + errorMessage);
          return null;
        }
      }
    );
  }

  // Get auto complete suggestions
  async getAutocompleteSuggestion(
    input: AutocompletionInput
  ): Promise<string | null> {
    const { systemPrompt, userPrompt } = getAutocompletePrompts(input);
    const feat = configState.getFeature("autocomplete");

    if (!feat) {
      throw new Error("Feature not found");
    }

    return await this.aiClient.getCompletion(
      feat.model,
      [systemPrompt, userPrompt!],
      {}
    );
  }

  // Get inline document suggestion
  async getInlineDocumentSuggestion(
    input: GenerateInlineDocumentInput
  ): Promise<string | null> {
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "GoNext: Generating docstring...",
        cancellable: true,
      },
      async (_, token) => {
        // On cancel
        token.onCancellationRequested(() => {
          this.aiClient.stopStream();
          vscode.window.showInformationMessage("Operation cancelled by user");
          return null;
        });

        const { systemPrompt, userPrompt } =
          getGenerateInlineDocumentPrompts(input);
        const feat = configState.getFeature("codeCompletion");
        if (!feat) {
          throw new Error("Feature not found");
        }
        const res = await this.aiClient.getCompletion(
          feat.model,
          [systemPrompt, userPrompt!],
          {
            maxTokens: 1024,
          }
        );

        return res;
      }
    );
  }

  //for now not getting from ai model but hardcode to test debounce time
  async getCompletion(code: string, language: string): Promise<string> {
    console.log(`Fetching completion for ${language} with prefix: "${code}"`);
    const completions =
      language === "typescript"
        ? ['console.log("Hello");', "let x = 10;", "function test() {}"]
        : ['print("Hello")', "x = 10", "def test(): pass"];
    return completions[Math.floor(Math.random() * completions.length)];
  }

  // Stream Chat completion
  async streamChatCompletion(
    selectedModel: string,
    messages: Array<{
      role: "system" | "assistant" | "user";
      content: string;
      snippet?: string;
    }>,
    preset: PromptPreset,
    onEvent: (event: StreamResponseChunk) => void
  ): Promise<void> {
    let prompts: Array<PromptMessage> = [];

    // Get context manager instance
    const contextManager = DiContainer.get<ContextManager>(
      INJECTION_KEYS.CONTEXT_MANAGER
    );
    const { document } = await contextManager.getCurrentFileInfo();

    // Add system message
    const currentFile = JSON.stringify({
      filename: document.fileName,
      content: document.getText(),
    });
    const contextFiles = JSON.stringify([]);
    prompts.push({
      role: "system",
      content: preset.system_prompt
        .replace("{{ current_file }}", currentFile)
        .replace("{{ context_files }}", contextFiles),
    });

    // Process messages
    const textSummarizer = new TextSummarizer();
    const processedMessages = await Promise.all(messages.map(async (item, index) => {
      let message = item.snippet ? (item.content + "\n" + item.snippet) : item.content;

      if (item.role === "user") {
        try {
          const tagRegex = /@([^\s]+)/g;
          const matches = [];
          let match;
          while ((match = tagRegex.exec(message)) !== null) {
            matches.push(match[1]);
          }
          const contextManager = DiContainer.get<ContextManager>(INJECTION_KEYS.CONTEXT_MANAGER);
          for (const tag of matches) {
            const fileContent = contextManager.getFileContent(tag);
            message += `\n${tag} CODE: \n${fileContent}`;
          }
        } catch (error) {
          console.error(error);
        }
      }

      const reverseIndex = messages.length - 1 - index;
      if (reverseIndex < 5) {
        return {
          role: item.role,
          content: message
        };
      } else {
        // Remove code from markdown
        message = message.replace(/```[\s\S]*?```/g, "[GENERATED CODE]");

        // Run summarizer
        const sentenceCount = reverseIndex >= 10 ? 5 : 10;
        const content = await textSummarizer.summarize(message, sentenceCount);
        return { role: item.role, content };
      }
    }));

    prompts.push(...processedMessages);

    this.aiClient.streamChatCompletion(selectedModel, prompts, onEvent);
  }

  /**
   * Summarizes a conversation based on the provided messages.
   *
   * @param messages - An array of message objects with the following properties:
   *   - `role`: The role of the message sender, which can be "system", "assistant", or "user".
   *   - `content`: The textual content of the message.
   *   - `snippet`: An optional snippet associated with the message.
   * @returns A promise that resolves to a string containing the summarized conversation.
   *          In case of an error, logs the error to the console.
   */
  summarizeConversation(
    messages: Array<{
      role: "system" | "assistant" | "user";
      content: string;
      snippet?: string;
    }>) {
    try {
      const { systemPrompt } =
        getConversationSummarizerPrompts(messages);
      const miscFeature = configState.features.find((feat) => feat.id === "misc");
      if (miscFeature && miscFeature.enabled && miscFeature.model) {
        return this.aiClient.getCompletion(
          miscFeature.model,
          [systemPrompt],
          {}
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Abort the current stream and reset the abort controller.
   *
   * This does not guarantee that the stream will immediately stop, but rather
   * that it will not be able to complete and will be cleaned up after the current
   * iteration.
   */
  stopStream() {
    this.aiClient.stopStream();
  }
}
