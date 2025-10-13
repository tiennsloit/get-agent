import { GoNextService } from "../../../services";
import { sidebarMessageSender } from "../messageSender";
import { SidebarInputCommands } from "../../../core/constants/sidebar";

export async function handleGetConversationTitle(message: any, service: GoNextService) {
  const { messages: conversationMessages, id: conversationId } = message.data;
  const title = await service.summarizeConversation(conversationMessages);
  
  sidebarMessageSender.post(SidebarInputCommands.GET_CONVERSATION_TITLE_RESPONSE, {
    conversationId,
    title
  });
}