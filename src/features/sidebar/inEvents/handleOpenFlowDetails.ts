import * as vscode from 'vscode';
import { FlowDetailProvider } from '../../flow/flowDetailProvider';
import { FlowDetailPanelRegistry } from '../../flow/flowDetailPanelRegistry';
import { DiContainer } from '../../../core/di-container';
import { INJECTION_KEYS } from '../../../core/constants/injectionKeys';
import { FlowService } from '../../../services/flowService';

export async function handleOpenFlowDetails(data: { flowId: string }): Promise<void> {
  try {
    // Check if a panel for this flow is already open
    const registry = FlowDetailPanelRegistry.getInstance();
    
    // If panel is already open, show it instead of creating a new one
    if (registry.isPanelOpen(data.flowId)) {
      registry.showPanel(data.flowId);
      return;
    }

    // Get the flow detail provider
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
    const flowDetailProvider = new FlowDetailProvider(context, data.flowId);
    const isDevelopment = process.env.VSCODE_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
    const flowService = DiContainer.get<FlowService>(INJECTION_KEYS.FLOW_SERVICE);

    // Verify flow exists
    const flow = await flowService.getFlow(data.flowId);

    // Create and show the flow details panel
    const panel = vscode.window.createWebviewPanel(
      'flowDetails',
      flow ? flow.title : 'New Flow',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: isDevelopment
          ? []
          : [
            vscode.Uri.joinPath(context.extensionUri, 'dist'),
            vscode.Uri.joinPath(context.extensionUri, 'webviews/flow-detail/dist'),
          ],
      }
    );

    // Set the HTML content
    panel.webview.html = flowDetailProvider.getHtmlForWebview(panel.webview);

    // Set up message handling
    flowDetailProvider.setWebviewPanel(panel);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    vscode.window.showErrorMessage(`Failed to open flow details: ${errorMessage}`);
  }
}