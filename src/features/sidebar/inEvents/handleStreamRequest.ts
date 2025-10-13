import * as vscode from "vscode";
import { v4 as uuidv4 } from 'uuid';
import {
  SidebarInputCommands,
  SidebarMessageState,
} from "../../../core/constants/sidebar";
import { GoNextService } from "../../../services";
import { sidebarMessageSender } from "../messageSender";
import { configState } from "../../../managers/state/configState";

export async function handleStreamRequest(message: any, service: GoNextService) {
  const { messages, preset, selectedModel } = message.data;

  // Generate UUID for assistant message
  const messageId = uuidv4();
  
  // Use passed selectedModel or fallback to global config
  let model = selectedModel;
  if (!model) {
    const chatFeature = configState.features.find((feat) => feat.id === 'chat');
    model = chatFeature!.model;
  }
  
  sidebarMessageSender.post(SidebarInputCommands.PREPARE_RESPONSE, {
    messageId,
    state: SidebarMessageState.GENERATING_RESPONSE,
  });
  
  await service.streamChatCompletion(
    model,
    messages,
    preset,
    (chunk) => {
      // Post to webview if content found
      sidebarMessageSender.post(SidebarInputCommands.STREAM_RESPONSE, {
        ...chunk,
        messageId,
      });
    }
  );
  
  sidebarMessageSender.post(SidebarInputCommands.PREPARE_RESPONSE, {
    messageId,
    state: SidebarMessageState.DONE,
  });
}