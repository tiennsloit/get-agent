/**
 * Handle get flows request from sidebar
 */

import * as vscode from 'vscode';
import { FlowService } from '../../../services/flowService';
import { sidebarMessageSender } from '../messageSender';
import { SidebarInputCommands } from '../../../core/constants/sidebar';
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';

export async function handleGetFlows(): Promise<void> {
  try {
    const flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);
    
    // Get all flows
    const flows = await flowService.getFlows();
    
    // Send flows back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_LIST_UPDATE, {
      flows
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Send error back to sidebar
    sidebarMessageSender.post(SidebarInputCommands.FLOW_ERROR, {
      error: errorMessage
    });
  }
}