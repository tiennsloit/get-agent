import { syncAppConfig } from "../outEvents/syncAppConfig";
import { syncFileInfo } from "../outEvents/syncFileInfo";
import { syncCodebase } from "../outEvents/syncCodebase";

export function handleSyncRequest() {
  // Send initial file/code base structure info
  syncAppConfig();
  syncFileInfo();
  syncCodebase();
}