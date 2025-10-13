import OpenAI from "openai";
import { PromptMessage } from "../core/types/promptMessage";
import { StreamResponseChunk } from "../core/types/chatChunk";
import { ChatCompletionMessageParam, ResponseFormatJSONObject, ResponseFormatJSONSchema, ResponseFormatText } from "openai/resources";

export type AIClientResponseFormat =
  | ResponseFormatText
  | ResponseFormatJSONSchema
  | ResponseFormatJSONObject
  | undefined;

export class RemoteAIClient {
  private static instance: RemoteAIClient;
  public abortController: AbortController | null = null;

  public static getInstance(): RemoteAIClient {
    if (!RemoteAIClient.instance) {
      RemoteAIClient.instance = new RemoteAIClient();
    }
    return RemoteAIClient.instance;
  }

  async completion(
    model: string,
    messages: Array<PromptMessage>,
    {
      responseFormat,
      baseURL,
      apiKey,
    }: {
      responseFormat?: AIClientResponseFormat;
      baseURL: string;
      apiKey: string;
    }
  ): Promise<string | null> {
    try {
      const client = new OpenAI({ baseURL, apiKey });
      this.abortController = new AbortController();
      const chatCompletion = await client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[],
        stream: false,
        response_format: responseFormat,
        temperature: 0.0,
        max_tokens: 6000,
      }, {
        signal: this.abortController?.signal
      });

      this.abortController = null;
      return chatCompletion.choices[0].message.content || null;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async *streamChatCompletion(
    model: string,
    messages: Array<PromptMessage>,
    { baseURL, apiKey }: { baseURL: string; apiKey: string }
  ): AsyncGenerator<StreamResponseChunk> {
    let messageId;

    try {

      // Count tokens and time
      let tokenCount = 0;
      const startTime = Date.now();
      const client = new OpenAI({ baseURL, apiKey });
      this.abortController = new AbortController();
      const stream = await client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[],
        stream: true,
        temperature: 0.0,
        max_tokens: 6000,
      }, {
        signal: this.abortController.signal,
      });

      let isStartThinking = false;
      let isEndThinking = false;
      for await (const chunk of stream) {
        messageId = chunk.id;
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || "";
        const reasoningContent = (delta as any)?.reasoning_content;
        tokenCount += 1;

        if (reasoningContent) {
          if (!isStartThinking) {
            isStartThinking = true;
            yield { messageId, content: "<think>" };
          }
          yield { messageId, content: reasoningContent };

        } else {
          if (isStartThinking && !isEndThinking) {
            isEndThinking = true;
            yield { messageId, content: "</think>" };
          }
          yield { messageId, content };
        }
      }

      // End stream
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      yield {
        messageId: messageId ?? "",
        endStreamData: {
          type: "stop",
          tokenCount,
          totalTime
        },
      };
      this.abortController = null;
    } catch (error) {
      console.error("Streaming error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unexpected error";
      yield {
        messageId: messageId ?? "",
        endStreamData: {
          type: "error",
          errorMessage,
          tokenCount: 99,
          totalTime: 99,
        },
      };
    }
  }

  async getModels(
    baseURL: string,
    apiKey: string
  ): Promise<OpenAI.Models.Model[]> {
    const client = new OpenAI({ baseURL, apiKey });
    const res = await client.models.list({ timeout: 1000 });
    return res.data;
  }

  stopStream() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
