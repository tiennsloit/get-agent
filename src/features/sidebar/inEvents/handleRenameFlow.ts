/**
 * Handle rename flow request from sidebar
 */

import * as vscode from 'vscode';
import { FlowService } from '../../../services/flowService';
import { sidebarMessageSender } from '../messageSender';
import { SidebarInputCommands } from '../../../core/constants/sidebar';
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';

export async function handleRenameFlow(data: { flowId: string }): Promise<void> {
  try {
    const flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);
    
    // Get the current flow to get the current title
    const flow = await flowService.getFlow(data.flowId);
    if (!flow) {
      vscode.window.showErrorMessage('Flow not found');
      return;
    }

    // Show input box to get new title
    const newTitle = await vscode.window.showInputBox({
      prompt: 'Enter new flow title',
      value: flow.title,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Title cannot be empty';
        }
        if (value.length > 100) {
          return 'Title must be less than 100 characters';
        }
        return null;
      }
    });

    // If user cancelled or provided empty title, return
    if (!newTitle || newTitle.trim() === flow.title) {
      return;
    }

    // Update the flow title
    await flowService.updateFlowTitle(data.flowId, newTitle.trim());
    
    // Get updated flows list
    const flows = await flowService.getFlows();
    
    // Send updated flows list back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_LIST_UPDATE, {
      flows
    });
    
    // Show success message
    vscode.window.showInformationMessage(`Flow renamed to "${newTitle}"`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Send error back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_ERROR, {
      error: errorMessage
    });
    
    vscode.window.showErrorMessage(`Failed to rename flow: ${errorMessage}`);
  }
}