import OpenAI from "openai";
import { injectable } from "inversify";
import { LocalAIClient } from "./localAIClient";
import { RemoteAIClient } from "./remoteAIClient";
import { StreamResponseChunk } from "../core/types/chatChunk";
import { PromptPreset } from "../core/types/chatPreset";
import { PromptMessage } from "../core/types/promptMessage";
import { configState } from "../managers/state/configState";

@injectable()
export class AIClient {
  private localAIClient: LocalAIClient;
  private remoteAIClient: RemoteAIClient;

  constructor() {
    this.localAIClient = LocalAIClient.getInstance();
    this.remoteAIClient = RemoteAIClient.getInstance();
  }

  public async getClient(
    model: string
  ): Promise<{ client: LocalAIClient | RemoteAIClient; modelName: string }> {
    const { isLocal, model: modelName } = await this.extractModelData(model);
    return {
      client: isLocal ? this.localAIClient : this.remoteAIClient,
      modelName,
    };
  }

  private async extractModelData(model: string): Promise<{
    isLocal: boolean;
    model: string;
    baseURL: string;
    apiKey: string;
  }> {
    const prefix = model.split(":")[0];
    const isLocal = prefix === "local";
    const modelName = model.split(":")[1];

    if (isLocal) {
      return { isLocal: true, model: modelName, baseURL: "", apiKey: "" };
    } else {
      const provider = configState.getProvider(prefix);

      if (!provider) {
        throw new Error("Provider not found");
      }
      if (!provider.configuration) {
        throw new Error("Provider configuration not found");
      }
      if (!provider.configuration.apiUrl || !provider.configuration.apiKey) {
        throw new Error("API URL or API Key not found");
      }
      return {
        isLocal: false,
        model: modelName,
        baseURL: provider.configuration.apiUrl,
        apiKey: provider.configuration.apiKey,
      };
    }
  }

  async getModels(
    apiUrl: string,
    apiKey: string
  ): Promise<OpenAI.Models.Model[]> {
    return this.remoteAIClient.getModels(apiUrl, apiKey);
  }

  async getCompletion(
    model: string,
    prompts: PromptMessage[],
    options: {
      maxTokens?: number;
      schema?: any;
    }
  ): Promise<string | null> {
    const { client, modelName } = await this.getClient(model);
    const { maxTokens, schema } = options;
    if (client instanceof LocalAIClient) {
      return client.completion(modelName, {
        systemPrompt: prompts.find((p) => p.role === "system")!,
        userPrompt: prompts.find((p) => p.role === "user"),
        maxTokens,
        schema,
      });
    } else if (client instanceof RemoteAIClient) {
      const { baseURL, apiKey } = await this.extractModelData(model);
      return client.completion(modelName, prompts, {
        baseURL,
        apiKey,
      });
    }
    return null;
  }

  async streamChatCompletion(
    selectedModel: string,
    messages: PromptMessage[],
    onEvent: (event: StreamResponseChunk) => void
  ): Promise<void> {
    console.info("Generating response...", messages);

    const { client, modelName } = await this.getClient(selectedModel);
    if (client instanceof LocalAIClient) {
      const promptsWithoutLast = messages.slice(0, messages.length - 1);
      const prompt = messages[messages.length - 1].content;
      client.streamChatCompletion(modelName, promptsWithoutLast, prompt, onEvent);
    } else if (client instanceof RemoteAIClient) {
      const { baseURL, apiKey } = await this.extractModelData(selectedModel);
      const stream = client.streamChatCompletion(modelName, messages, {
        baseURL,
        apiKey,
      });
      for await (const chunk of stream) {
        onEvent(chunk);
      }
    }
  }

  stopStream() {
    this.localAIClient.stopStream();
    this.remoteAIClient.stopStream();
  }
}