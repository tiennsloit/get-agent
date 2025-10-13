import { SidebarInputCommands } from "../../../core/constants/sidebar";
import { sidebarMessageSender } from "../messageSender";

export function showSidebarSettings(options: any) {
    sidebarMessageSender.post(SidebarInputCommands.SHOW_SIDEBAR_SETTINGS, options);
}