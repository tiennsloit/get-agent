<script setup lang="ts">
import { onMounted } from "vue";
import FlowPage from "./pages/FlowPage.vue";
import { MessageHandler } from './utilities/messageHandler';
import { OutputCommands } from "./constants/commands";
import { vscode } from "./utilities/vscode";

// Initialize a message handler instance
const messageHandler = new MessageHandler();

onMounted(async () => {
  // Listen to messages from the extension
  window.addEventListener('message', messageHandler.handleMessage);

  // Request extension to sync data
  vscode.postMessage({command: OutputCommands.SYNC_REQUEST});
});
</script>

<template>
  <FlowPage />
</template>