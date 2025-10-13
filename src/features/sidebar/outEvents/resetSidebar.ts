import { SidebarInputCommands } from "../../../core/constants/sidebar";
import { sidebarMessageSender } from "../messageSender";

export function resetSidebar() {
    sidebarMessageSender.post(SidebarInputCommands.RESET, null);
}