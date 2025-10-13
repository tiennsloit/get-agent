import * as vscode from "vscode";
import { SidebarOutputCommands } from "../../core/constants/sidebar";
import { GoNextService } from "../../services";
import { DiContainer } from "../../core/di-container";
import { INJECTION_KEYS } from "../../core/constants/injectionKeys";
import {
  handleSyncRequest,
  handleStreamRequest,
  handleGetConversationTitle,
  handleInsertCode,
  handleRunCommand,
  handleFetchModels,
  handleUpdateAppConfig,
  handleEditFile,
  handleStopStream,
  handleDownloadModel,
  handleDeleteLocalModel,
  handleShowAlert,
  handleCreateFlow,
  handleGetFlows,
  handleDeleteFlow,
  handleRenameFlow,
  handleSearchFlows,
  handleOpenFlowDetails,
} from "./inEvents";

export function setSidebarMessageListener(
  webview: vscode.Webview,
  disposables: vscode.Disposable[]
) {
  const service = DiContainer.get<GoNextService>(INJECTION_KEYS.GONEXT_SERVICE);

  webview.onDidReceiveMessage(
    async (message: any) => {
      console.log("[sidebar] onReceiveMessage", message);
      const command = message.command;

      try {
        switch (command) {
          case SidebarOutputCommands.SYNC_REQUEST:
            handleSyncRequest();
            break;

          case SidebarOutputCommands.STREAM_REQUEST:
            handleStreamRequest(message, service);
            break;

          case SidebarOutputCommands.GET_CONVERSATION_TITLE:
            handleGetConversationTitle(message, service);
            break;

          case SidebarOutputCommands.INSERT_CODE:
            handleInsertCode(message);
            break;

          case SidebarOutputCommands.RUN_COMMAND:
            handleRunCommand(message);
            break;

          case SidebarOutputCommands.FETCH_MODELS:
            handleFetchModels(message, service);
            break;

          case SidebarOutputCommands.UPDATE_APP_CONFIG:
            handleUpdateAppConfig(message);
            break;

          case SidebarOutputCommands.EDIT_FILE:
            handleEditFile(message);
            break;

          case SidebarOutputCommands.STOP_STREAM:
            handleStopStream(service);
            break;

          case SidebarOutputCommands.DOWNLOAD_MODEL:
            handleDownloadModel(message);
            break;

          case SidebarOutputCommands.DELETE_LOCAL_MODEL:
            handleDeleteLocalModel(message);
            break;

          case SidebarOutputCommands.SHOW_ALERT:
            handleShowAlert(message);
            break;

          // Flow commands
          case SidebarOutputCommands.CREATE_FLOW:
            handleCreateFlow();
            break;

          case SidebarOutputCommands.GET_FLOWS:
            handleGetFlows();
            break;

          case SidebarOutputCommands.DELETE_FLOW:
            handleDeleteFlow(message.data);
            break;

          case SidebarOutputCommands.RENAME_FLOW:
            handleRenameFlow(message.data);
            break;

          case SidebarOutputCommands.SEARCH_FLOWS:
            handleSearchFlows(message.data);
            break;

          case SidebarOutputCommands.OPEN_FLOW_DETAILS:
            handleOpenFlowDetails(message.data);
            break;

          default:
            console.warn(`Unhandled command: ${command}`);
            break;
        }
      } catch (error) {
        console.error(`Error handling command ${command}:`, error);
        vscode.window.showErrorMessage(`Error processing request: ${error}`);
      }
    },
    undefined,
    disposables
  );
}
