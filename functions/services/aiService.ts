import OpenAI from "openai";
import { Message } from "../../shared/models/message";
import { z } from "zod";
import { Stream } from "openai/streaming";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export class AIService {
  static async completionWithSchema<T>(messages: Message[], schema?: z.ZodSchema<T>): Promise<T> {
    try {
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3-32b",
        messages: messages.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        temperature: 0,
        max_tokens: 8192,
        top_p: 1,
        response_format: { type: "json_object" },
        stream: false,
      });

      const content = response.choices[0]?.message?.content;
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
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  static async completionStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: StreamOptions
  ): Promise<void> {
    try {
      const stream = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: messages.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        temperature: options?.temperature ?? 0.1,
        max_tokens: options?.maxTokens ?? 16384,
        top_p: options?.topP ?? 1,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      console.error("AI Service Streaming Error:", error);
      throw error;
    }
  }
}