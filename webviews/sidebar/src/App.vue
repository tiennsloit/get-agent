<script setup lang="ts">
import { onMounted } from "vue";
import ChatPage from './pages/ChatPage.vue';
import HistoryPage from "./pages/HistoryPage.vue";
import SettingPage from "./pages/SettingPage.vue";
import { MessageHandler } from './utilities/messageHandler';
import { storeToRefs } from "pinia";
import { OutputCommands } from "./constants/commands";
import { useAppStore } from "./stores/app";
import { ChatScreen } from "./types/appState";import { vscode } from "./utilities/vscode";

// AI Chat Store
const appStore = useAppStore();
const { screen } = storeToRefs(appStore);

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
  <ChatPage v-if="screen === ChatScreen.CHAT" />
  <HistoryPage v-if="screen === ChatScreen.HISTORY" />
  <SettingPage v-if="screen === ChatScreen.SETTING" />
</template>