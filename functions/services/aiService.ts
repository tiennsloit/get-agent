import { Message } from "../../shared/models/message";
import { z } from "zod";
import { ProviderManager } from "./providerManager";

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * AI Service - Clean interface for AI operations
 */
export class AIService {

  /**
   * Convert internal Message format to provider format
   */
  private static formatMessages(messages: Message[]): string {
    return messages
      .map((msg) => {
        const role = msg.role.toUpperCase();
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }

  /**
   * Completion with JSON schema validation
   * Automatically switches providers based on priority if one fails
   */
  static async completionWithSchema<T>(messages: Message[], schema?: z.ZodSchema<T>): Promise<T> {
    try {
      const prompt = this.formatMessages(messages);

      // Add JSON format instruction
      const jsonPrompt = `${prompt}\n\nIMPORTANT: You must respond with a valid JSON object only. Do not include any other text.`;

      const response = await ProviderManager.request(jsonPrompt, {
        temperature: 0,
        maxTokens: 8192,
      });

      const content = response.text;

      if (!content) {
        throw new Error("No content received from AI service");
      }

      try {
        const parsedContent = JSON.parse(content);
        if (schema) {
          return schema.parse(parsedContent);
        } else {
          return parsedContent;
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  /**
   * Streaming completion with automatic provider fallback
   */
  static async completionStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: StreamOptions
  ): Promise<void> {
    try {
      const prompt = this.formatMessages(messages);

      const stream = await ProviderManager.stream(prompt, {
        temperature: options?.temperature ?? 0.1,
        maxTokens: options?.maxTokens ?? 16384,
      });

      // Handle streaming response
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) { break; }

          const chunkStr = decoder.decode(value, { stream: true });

          // Parse SSE format if needed
          const lines = chunkStr.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.substring(6);
              if (data === "[DONE]") {
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                // Handle both Ollama and OpenAI-compatible formats
                const content = parsed.response || parsed.choices?.[0]?.delta?.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
                // If not JSON, just send the raw data
                if (data.trim()) {
                  onChunk(data);
                }
              }
            } else if (line.trim() && !line.startsWith(":")) {
              // Handle non-SSE format (raw text)
              try {
                const parsed = JSON.parse(line);
                const content = parsed.response || parsed.choices?.[0]?.delta?.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
                // Not JSON, send as-is
                onChunk(line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("AI Service Streaming Error:", error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  static async close(): Promise<void> {
    await ProviderManager.close();
  }
}