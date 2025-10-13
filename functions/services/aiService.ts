import OpenAI from "openai";
import { Message } from "../models/message";
import { z } from "zod";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

export class AIService {
  static async completionWithSchema<T>(messages: Message[], schema?: z.ZodSchema<T>): Promise<T> {
    try {
      const response = await groq.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct",
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
}