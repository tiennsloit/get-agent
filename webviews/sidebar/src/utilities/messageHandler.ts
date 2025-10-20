import { useEventBus } from '@vueuse/core';
import { InputCommands } from '@/constants/commands';
import { WebviewInputCommands } from '@shared/constants/commands';
import { useAppConfigStore } from '@/stores/appConfig';
import { useContextStore } from '@/stores/context';
import { useFlowStore } from '@/stores/flowStore';
import type { ModelConfig } from '@/types/appConfig';
import { BusEvents } from '@/constants/busEvent';
import { useAppStore } from '@/stores/app';

export class MessageHandler {
  // Handle messages from the extension
  handleMessage(event: MessageEvent) {
    const appKeyBus = useEventBus<any>(BusEvents.APP_KEY);
    const syncModelsBus = useEventBus<{ id: string; models: ModelConfig[] }>(BusEvents.SYNC_MODELS);
    const appStore = useAppStore();
    const contextStore = useContextStore();
    const appConfigStore = useAppConfigStore();
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
    } else if (command === InputCommands.FETCH_MODELS_RESPONSE) {
      syncModelsBus.emit(data);
    } else if (command === WebviewInputCommands.FLOW_LIST_UPDATE) {
      // Update flow list
      flowStore.setFlows(data.flows);
      flowStore.setLoading(false);
    } else if (command === WebviewInputCommands.FLOW_CREATED) {
      // Add newly created flow
      flowStore.addFlow(data.flow);
    } else if (command === WebviewInputCommands.FLOW_UPDATED) {
      // Update existing flow
      flowStore.updateFlow(data.flowId, data.updates);
    } else if (command === WebviewInputCommands.FLOW_DELETED) {
      // Remove deleted flow
      flowStore.removeFlow(data.flowId);
    } else if (command === WebviewInputCommands.FLOW_ERROR) {
      // Handle flow error
      console.error('Flow error:', data.error);
      flowStore.setLoading(false);
      // You could show a toast notification here
    } else if (command === InputCommands.RESET) {
      // Reset all stores
      appStore.$reset();
      appConfigStore.$reset();
      contextStore.$reset();
      flowStore.$reset();
      appKeyBus.emit();
    }
  }
}
