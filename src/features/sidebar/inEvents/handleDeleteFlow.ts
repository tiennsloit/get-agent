/**
 * Handle delete flow request from sidebar
 */

import * as vscode from 'vscode';
import { FlowService } from '../../../services/flowService';
import { sidebarMessageSender } from '../messageSender';
import { SidebarInputCommands } from '../../../core/constants/sidebar';
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';

export async function handleDeleteFlow(data: { flowId: string }): Promise<void> {
  try {
    const flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);
    
    // Delete the flow
    await flowService.deleteFlow(data.flowId);
    
    // Get updated flows list
    const flows = await flowService.getFlows();
    
    // Send updated flows list back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_LIST_UPDATE, {
      flows
    });
    
    // Show success message
    vscode.window.showInformationMessage('Flow deleted successfully');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Send error back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_ERROR, {
      error: errorMessage
    });
    
    vscode.window.showErrorMessage(`Failed to delete flow: ${errorMessage}`);
  }
}