import { useEventBus } from '@vueuse/core';
import { InputCommands } from '@/constants/commands';
import { useChatStore } from '@/stores/chat';
import { useAppConfigStore } from '@/stores/appConfig';
import { useContextStore } from '@/stores/context';
import { useFlowStore } from '@/stores/flowStore';
import type { ModelConfig } from '@/types/appConfig';
import { BusEvents } from '@/constants/busEvent';
import { useAppStore } from '@/stores/app';
import { ChatScreen, ChatMode } from '@/types/appState';
import { useSetting } from '@/composables/useSetting';
import { SETTING_SECTIONS } from '@/constants/setting';

export class MessageHandler {
  // Handle messages from the extension
  handleMessage(event: MessageEvent) {
    const appKeyBus = useEventBus<any>(BusEvents.APP_KEY);
    const syncModelsBus = useEventBus<{ id: string; models: ModelConfig[] }>(BusEvents.SYNC_MODELS);
    const appStore = useAppStore();
    const contextStore = useContextStore();
    const appConfigStore = useAppConfigStore();
    const chatStore = useChatStore();
    const flowStore = useFlowStore();
    const { command, data } = event.data;

    if (command === InputCommands.SYNC_CODEBASE) {
      // Update codebase structure
      contextStore.setCodeStructure(data);
    } else if (command === InputCommands.SYNC_FILE_INFO) {
      // Update active file info
      contextStore.setActiveFileInfo(data);
    } else if (command === InputCommands.SYNC_CONFIG) {
      // Update app config
      appConfigStore.copyWith(data, true);
    } else if (command === InputCommands.NEW_CHAT) {
      // Start a new chat session
      const { prompt, snippet, preset } = data;
      chatStore.createConversation({ prompt, snippet, preset });
      appStore.copyWith({ chatMode: ChatMode.NORMAL });
    } else if (command === InputCommands.OPEN_HISTORY) {
      // Open history page
      appStore.copyWith({ screen: ChatScreen.HISTORY });
    } else if (command === InputCommands.SHOW_SIDEBAR_SETTINGS) {
      // Open settings page
      const session = data?.session ?? SETTING_SECTIONS.FEATURES;
      const payload = data?.payload ?? {};
      const { open } = useSetting();
      open(session, payload);
    } else if (command === InputCommands.STREAM_RESPONSE) {
      const { messageId, content, endStreamData } = data;
      if (endStreamData) {
        chatStore.stopAiResponse(messageId, endStreamData);
      } else {
        chatStore.addAiResponse(messageId, content);
      }
    } else if (command === InputCommands.FETCH_MODELS_RESPONSE) {
      syncModelsBus.emit(data);
    } else if (command === InputCommands.GET_CONVERSATION_TITLE_RESPONSE) {
      chatStore.setConversationTitle(data.conversationId, data.title);
    } else if (command === InputCommands.FLOW_LIST_UPDATE) {
      // Update flow list
      flowStore.setFlows(data.flows);
    } else if (command === InputCommands.FLOW_CREATED) {
      // Add newly created flow
      flowStore.addFlow(data.flow);
    } else if (command === InputCommands.FLOW_UPDATED) {
      // Update existing flow
      flowStore.updateFlow(data.flowId, data.updates);
    } else if (command === InputCommands.FLOW_DELETED) {
      // Remove deleted flow
      flowStore.removeFlow(data.flowId);
    } else if (command === InputCommands.FLOW_ERROR) {
      // Handle flow error
      console.error('Flow error:', data.error);
      // You could show a toast notification here
    } else if (command === InputCommands.RESET) {
      // Reset all stores
      chatStore.$reset();
      appStore.$reset();
      appConfigStore.$reset();
      contextStore.$reset();
      flowStore.$reset();
      appKeyBus.emit();
    }
  }
}
