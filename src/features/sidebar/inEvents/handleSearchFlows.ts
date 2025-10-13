/**
 * Handle search flows request from sidebar
 */

import { FlowService } from '../../../services/flowService';
import { sidebarMessageSender } from '../messageSender';
import { SidebarInputCommands } from '../../../core/constants/sidebar';
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';

export async function handleSearchFlows(data: { query: string }): Promise<void> {
  try {
    const flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);
    
    // Search flows
    const flows = await flowService.searchFlows(data.query);
    
    // Send search results back to sidebar
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