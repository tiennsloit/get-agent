/**
 * AI message interface for LLM communication
 * Used by serverless functions for AI service integration
 */

export interface Message {
  role: "system" | "assistant" | "user";
  content: string;
}
