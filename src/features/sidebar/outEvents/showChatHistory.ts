import { SidebarInputCommands } from "../../../core/constants/sidebar";
import { sidebarMessageSender } from "../messageSender";

export function showChatHistory() {
    sidebarMessageSender.post(SidebarInputCommands.OPEN_HISTORY, null);
}