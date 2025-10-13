import * as vscode from "vscode";
import { GoNextService } from "../../../services";
import { sidebarMessageSender } from "../messageSender";
import { SidebarInputCommands } from "../../../core/constants/sidebar";

export async function handleFetchModels(message: any, service: GoNextService) {
  const { id, apiUrl, apiKey } = message.data;
  
  try {
    const models = await service.getModels(apiUrl, apiKey);
    sidebarMessageSender.post(
      SidebarInputCommands.FETCH_MODELS_RESPONSE,
      {
        id,
        models,
      }
    );
  } catch (e) {
    sidebarMessageSender.post(
      SidebarInputCommands.FETCH_MODELS_RESPONSE,
      {
        id,
        models: [],
      }
    );
    const errorMessage =
      e instanceof Error
        ? e.message
        : "Unable to get model list from " + apiUrl;
    vscode.window.showErrorMessage("Error: " + errorMessage);
  }
}