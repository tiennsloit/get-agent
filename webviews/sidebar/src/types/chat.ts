// Base types
export interface ConversationPreview {
  id: string;
  title: string;
  subtitle: string;
  time: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant',
  timestamp: Date;
  content?: any;
}

export interface UserMessage extends Message {
  role: 'user';
  snippet?: string;
  content: string;
}

export interface MessageMetadata {
  time: number;
  tokens: number;
}

// Chat-specific types
export enum MessageState {
  IDLE = 'IDLE',
  GENERATING_RESPONSE = 'GENERATING_RESPONSE',
  DONE = 'DONE',
}

export interface AssistantMessage extends Message {
  role: 'assistant';
  error?: string;
  state?: MessageState;
  metadata?: MessageMetadata;
  snippet?: string;
  content: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Array<AssistantMessage | UserMessage>;
  selectedModel: string | null | undefined;
}

export interface ChatState {
  isLoading: boolean;
  currentConversationId: string | null;
  conversations: ChatConversation[];
  selectedPreset: string;
  selectedModel: string;
}

// Unified types for components that work with both
export type Conversation = ChatConversation;
export type ChatStateType = ChatState;
