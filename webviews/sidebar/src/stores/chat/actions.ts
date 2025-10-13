import { v4 } from 'uuid';
import { ChatScreen } from '@/types/appState';
import { useAppStore } from '@/stores/app';
import { MessageState, type AssistantMessage, type ChatConversation } from '@/types/chat';
import { useSettingStore } from '@/stores/setting';
import { vscode } from '@/utilities/vscode';
import { OutputCommands } from '@/constants/commands';
import type { UserMessage } from '@/types/chat';

type Message = AssistantMessage | UserMessage;

export const chatActions = {
  // Message management actions
  addUserMessage(this: any, content: string, snippet?: string): void {
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    const message: UserMessage = {
      id: v4(),
      role: 'user' as const,
      timestamp: new Date(),
      content,
      snippet,
    };

    conversation.messages.push(message);
  },

  addAssistantMessage(this: any, content: string): void {
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    const message: AssistantMessage = {
      id: v4(),
      role: 'assistant' as const,
      timestamp: new Date(),
      content,
    };

    conversation.messages.push(message);
  },

  deleteMessage(this: any, messageId: string): void {
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    const index = conversation.messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      conversation.messages.splice(index, 1);
    }
  },

  clearMessages(this: any): void {
    const conversation = this.currentConversation;
    if (conversation) {
      conversation.messages = [];
    }
  },

  setLoading(this: any, loading: boolean): void {
    this.isLoading = loading;
  },

  setError(this: any, messageId: string, error: string | null): void {
    const conversation = this.currentConversation;
    this.isLoading = false;
    if (!conversation) { return; }

    const message = conversation.messages.find((msg: Message) => msg.id === messageId);
    if (message) {
      message.error = error;
    }
  },

  regenerateMessage(this: any, messageId: string) {
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    const messageIndex = conversation.messages.findIndex((msg: Message) => msg.id === messageId);
    if (messageIndex === -1) { return; }

    // Remove the message and all messages after it
    conversation.messages.splice(messageIndex);

    // Find the last user message to regenerate from
    const lastUserMessage = conversation.messages.slice().reverse().find((msg: Message) => msg.role === 'user');
    if (lastUserMessage) {
      this.submitPrompt(lastUserMessage.content, {
        snippet: lastUserMessage.snippet,
        skipAddMessage: true,
      });
    }
  },

  // AI response actions
  createAssistantMessage(this: any, id: string): void {
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    const message: AssistantMessage = {
      id,
      role: 'assistant',
      timestamp: new Date(),
      state: MessageState.IDLE,
      content: '',
    };

    conversation.messages.push(message);
  },

  addAiResponse(this: any, messageId: string, content: string): void {
    const conversation = this.currentConversation;
    if (!conversation) {
      throw new Error('No active conversation');
    }

    // Find or create assistant message
    let message = conversation.messages.find((msg: Message) => msg.id === messageId);
    if (!message) {
      this.createAssistantMessage(messageId);
      message = conversation.messages.find((msg: Message) => msg.id === messageId)!;
    }

    if (message.state === MessageState.DONE) {
      return message;
    }

    message.state = MessageState.GENERATING_RESPONSE;
    message.content += content;
  },

  stopAiResponse(
    this: any,
    messageId: string,
    {
      type,
      errorMessage,
      totalTime,
      tokenCount,
    }: { type: string; errorMessage?: string; totalTime: number; tokenCount: number }
  ): void {
    this.isLoading = false;
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    const message = conversation.messages.find((msg: Message) => msg.id === messageId);
    if (message) {
      message.state = MessageState.DONE;
      message.metadata = {
        time: totalTime,
        tokens: tokenCount,
      };
    }

    if (type === 'error') {
      this.error = errorMessage ?? "Unable to get AI response";
    }
  },

  setMessageState(this: any, messageId: string, state: MessageState): void {
    const conversation = this.currentConversation;
    if (!conversation) { return; }

    let message = conversation.messages.find((msg: Message) => msg.id === messageId);
    if (!message) {
      this.createAssistantMessage(messageId);
      message = conversation.messages.find((msg: Message) => msg.id === messageId)!;
    }

    message.state = state;
  },

  stopGeneration(this: any): void {
    this.isLoading = false;

    // Stop all generating messages in current conversation
    const conversation = this.currentConversation;
    if (conversation) {
      conversation.messages.forEach((message: Message) => {
        if (message.role === 'assistant') {
          (message as AssistantMessage).state = MessageState.DONE;
        }
      });
    }

    vscode.postMessage({
      command: OutputCommands.STOP_STREAM,
      data: {
        isAdvanced: false,
      },
    });
  },

  // Conversation management actions
  createConversation(
    this: any,
    { title, prompt, snippet, preset, model }: { title?: string; prompt?: string; snippet?: string; preset?: string; model?: string }
  ): string {
    const appStore = useAppStore();
    const conversationId = v4();
    const conversation: ChatConversation = {
      id: conversationId,
      title: title ?? 'New Chat',
      timestamp: new Date(),
      messages: [],
      selectedModel: model || this.selectedModel,
    };

    const settingStore = useSettingStore();
    const presets = settingStore.presets;
    const findPreset = presets.find((p: any) => p.name === preset);
    this.selectedPreset = findPreset ? preset! : 'DefaultChat';
    this.conversations.push(conversation);
    this.currentConversationId = conversationId;
    this.isLoading = false;
    this.error = null;
    appStore.copyWith({ screen: ChatScreen.CHAT });

    if (prompt) {
      this.submitPrompt(prompt, { snippet });
    }

    return conversationId;
  },

  switchConversation(this: any, conversationId: string): void {
    this.currentConversationId = conversationId;
  },

  deleteConversation(this: any, conversationId: string): void {
    const index = this.conversations.findIndex((conv: ChatConversation) => conv.id === conversationId);
    if (index !== -1) {
      this.conversations.splice(index, 1);
    }

    if (this.currentConversationId === conversationId) {
      this.currentConversationId = this.conversations[0]?.id || null;
    }
  },

  setConversationTitle(this: any, conversationId: string, title: string): void {
    const index = this.conversations.findIndex((conv: ChatConversation) => conv.id === conversationId);
    if (index !== -1) {
      this.conversations[index].title = title;
    }
  },

  setSelectedModel(this: any, model: string): void {
    this.selectedModel = model;
    const conversation = this.currentConversation;
    if (conversation) {
      conversation.selectedModel = model;
    }
  },

  submitPrompt(this: any, prompt: string, options: { snippet?: string, skipAddMessage: boolean } = { skipAddMessage: false }): void {
    if (!this.currentConversationId) {
      this.createConversation({});
    }

    this.isLoading = true;
    this.error = null;
    if (!options.skipAddMessage) {
      this.addUserMessage(prompt, options.snippet);
    }
    this.sendStreamRequest();
  },

  // AI response handling - sends stream request to extension
  sendStreamRequest(this: any): void {
    const conversation = this.currentConversation;
    if (!conversation) {
      throw new Error('No active conversation');
    }

    // Convert messages to the format expected by the extension
    const messages: Array<{ role: string; content: string; snippet?: string }> = [];
    conversation.messages.forEach((message: any) => {
      const { role, content, snippet } = message;
      messages.push({ role, content, snippet });
    });

    // Get preset configuration
    const settingStore = useSettingStore();
    const presets = settingStore.presets;
    const selectedPreset = presets.find((preset: any) => preset.name === this.selectedPreset);
    const preset = JSON.parse(JSON.stringify(selectedPreset));

    // Send stream request to extension
    vscode.postMessage({
      command: OutputCommands.STREAM_REQUEST,
      data: {
        messages,
        preset,
        selectedModel: conversation.selectedModel || this.selectedModel
      },
    });

    // Request conversation title if needed
    if (!conversation.title || conversation.title === 'New Chat') {
      vscode.postMessage({
        command: OutputCommands.GET_CONVERSATION_TITLE,
        data: { messages, id: this.currentConversationId },
      });
    }
  },
};