/**
 * Flow input commands for sidebar webview
 */

export enum FlowInputCommands {
  FLOW_LIST_UPDATE = 'flow_list_update',
  FLOW_STATE_CHANGE = 'flow_state_change',
  FLOW_PROGRESS_UPDATE = 'flow_progress_update',
  FLOW_BLUEPRINT_GENERATED = 'flow_blueprint_generated',
  FLOW_ERROR = 'flow_error'
}

/**
 * Flow output commands from sidebar webview
 */
export enum FlowOutputCommands {
  CREATE_FLOW = 'create_flow',
  GET_FLOWS = 'get_flows',
  GENERATE_BLUEPRINT = 'generate_blueprint',
  START_FLOW_EXECUTION = 'start_flow_execution',
  PAUSE_FLOW_EXECUTION = 'pause_flow_execution',
  STOP_FLOW_EXECUTION = 'stop_flow_execution',
  DELETE_FLOW = 'delete_flow',
  OPEN_FLOW_DETAILS = 'open_flow_details'
}