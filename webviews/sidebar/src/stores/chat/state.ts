import type { ChatState } from '@/types/chat';
import { useSettingStore } from '../setting';

export const createChatState = (): ChatState => {
  const settingStore = useSettingStore();
  const selectedPreset = settingStore.presets[0]?.name || 'DefaultChat';

  return {
    isLoading: false,
    currentConversationId: null,
    conversations: [],
    selectedPreset,
    selectedModel: 'default',
  };
};