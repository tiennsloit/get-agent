/**
 * Command constants shared across extension and webviews
 * Ensures consistent command identifiers for communication
 */

/**
 * Extension commands registered with VS Code
 */
export const EXTENSION_COMMANDS = {
  SHOW_SETTINGS: 'gonext.show-settings',
  SHOW_SIDEBAR: 'gonext.show-sidebar',
  SHOW_WALKTHROUGH: 'gonext.show-walkthrough',
  CREATE_FLOW: 'gonext.flow.create',
  PAUSE_FLOW: 'gonext.flow.pause',
  RESUME_FLOW: 'gonext.flow.resume',
} as const;

/**
 * Input commands (Extension → Webview)
 */
export enum WebviewInputCommands {
  FLOW_LIST_UPDATE = "FLOW_LIST_UPDATE",
  FLOW_CREATED = "FLOW_CREATED",
  FLOW_UPDATED = "FLOW_UPDATED",
  FLOW_DELETED = "FLOW_DELETED",
  FLOW_ERROR = "FLOW_ERROR"
}

/**
 * Output commands (Webview → Extension)
 */
export enum WebviewOutputCommands {
  CREATE_FLOW = "CREATE_FLOW",
  GET_FLOWS = "GET_FLOWS",
  SEARCH_FLOWS = "SEARCH_FLOWS",
  GENERATE_FLOW_BLUEPRINT = "GENERATE_FLOW_BLUEPRINT",
  START_FLOW_EXECUTION = "START_FLOW_EXECUTION",
  PAUSE_FLOW_EXECUTION = "PAUSE_FLOW_EXECUTION",
  STOP_FLOW_EXECUTION = "STOP_FLOW_EXECUTION",
  DELETE_FLOW = "DELETE_FLOW",
  RENAME_FLOW = "RENAME_FLOW",
  OPEN_FLOW_DETAILS = "OPEN_FLOW_DETAILS"
}
