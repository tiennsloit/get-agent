import { WebviewInputCommands } from '@shared/constants/commands';
import { useFlowStore } from '@/stores/flowStore';

export class MessageHandler {
  // Handle messages from the extension
  handleMessage(event: MessageEvent) {
    const flowStore = useFlowStore();
    const { command, data } = event.data;

    if (command === WebviewInputCommands.FLOW_LIST_UPDATE) {
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
    }
  }
}
