<script setup lang="ts">
import { onMounted } from "vue";
import FlowPage from "./pages/FlowPage.vue";
import { MessageHandler } from './utilities/messageHandler';
import { vscode } from "./utilities/vscode";

// Initialize a message handler instance
const messageHandler = new MessageHandler();

onMounted(async () => {
  // Listen to messages from the extension
  window.addEventListener('message', messageHandler.handleMessage);
});
</script>

<template>
  <FlowPage />
</template>