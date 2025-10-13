import type { ChatState, ChatConversation, AssistantMessage } from '@/types/chat';
import type { UserMessage, ConversationPreview } from '@/types/chat';

export const chatGetters = {
  currentConversation(state: ChatState): ChatConversation | null {
    return state.currentConversationId
      ? state.conversations.find((item) => item.id === state.currentConversationId) || null
      : null;
  },

  messages(state: ChatState): Array<AssistantMessage | UserMessage> {
    const currentConv = state.currentConversationId
      ? state.conversations.find((item) => item.id === state.currentConversationId) || null
      : null;
    return currentConv?.messages ?? [];
  },

  currentMessageIds(state: ChatState): string[] {
    const currentConv = state.currentConversationId
      ? state.conversations.find((item) => item.id === state.currentConversationId) || null
      : null;
    return currentConv?.messages.map((message) => message.id) ?? [];
  },

  conversationHistory(state: ChatState): ConversationPreview[] {
    return state.conversations.map((conv) => {
      let subtitle = 'Empty conversation!';
      if (conv.messages.length) {
        const lastMessage = conv.messages[conv.messages.length - 1];
        subtitle = lastMessage['content'];
      }

      return {
        id: conv.id,
        title: conv.title,
        subtitle,
        time: new Date(conv.timestamp),
      };
    });
  },

  recentConversations(state: ChatState): ConversationPreview[] {
    return state.conversations
      .map((conv) => {
        let subtitle = 'Empty conversation!';
        if (conv.messages.length) {
          const lastMessage = conv.messages[conv.messages.length - 1];
          subtitle = lastMessage['content'];
        }

        return {
          id: conv.id,
          title: conv.title,
          subtitle,
          time: new Date(conv.timestamp),
        };
      })
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  },
};