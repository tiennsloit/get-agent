/**
 * Handle create flow request from sidebar
 */

import * as vscode from 'vscode';
import { FlowService } from '../../../services/flowService';
import { sidebarMessageSender } from '../messageSender';
import { SidebarInputCommands } from '../../../core/constants/sidebar';
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';
import { handleOpenFlowDetails } from './handleOpenFlowDetails';

export async function handleCreateFlow(): Promise<void> {
  try {
    const flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);

    // Create the flow
    const flowId = await flowService.createFlow({ title: "New Flow" });

    // Get updated flows list
    const flows = await flowService.getFlows();

    // Send updated flows list back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_LIST_UPDATE, {
      flows
    });

    // Open flow details immediately
    await handleOpenFlowDetails({ flowId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Send error back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_ERROR, {
      error: errorMessage
    });

    vscode.window.showErrorMessage(`Failed to create flow: ${errorMessage}`);
  }
}