<script setup lang="ts">
import ChatIcon from "@/components/icons/ChatIcon.vue"
import { formatTime } from "@/utilities/formatTime"
import { useChatStore } from "@/stores/chat";
import { useAppStore } from "@/stores/app";
import { storeToRefs } from "pinia";
import TrashIcon from "@/components/icons/TrashIcon.vue";
import { computed } from "vue";
import { ChatMode, ChatScreen } from "@/types/appState";

const appStore = useAppStore();
const chatStore = useChatStore();

// Get conversation history from chat store
const conversationHistory = computed(() => {
  return chatStore.conversationHistory.map(conv => ({ ...conv, type: 'normal' as const }));
});

const newChat = () => {
  // Create a new conversation
  chatStore.createConversation({});
};

const openChat = (id: string, type: 'normal') => {
  // Switch to chat mode and open conversation
  appStore.copyWith({
    screen: ChatScreen.CHAT,
    chatMode: ChatMode.NORMAL
  });
  chatStore.switchConversation(id);
};

const deleteChat = (id: string, type: 'normal') => {
  chatStore.deleteConversation(id);
};
</script>

<template>
  <div class="select-none mx-auto">
    <ul class="divide-y divide-zinc-500/50">
      <li class="px-4 py-3 hover:bg-zinc-500/10 cursor-pointer transition-colors duration-150" @click="newChat">
        <div class="flex justify-center space-x-2 items-center">
          <ChatIcon />
          <p class="text-sm font-semibold truncate">
            New conversation
          </p>
        </div>
      </li>

      <li v-if="conversationHistory?.length" v-for="(item, index) in conversationHistory" :key="index"
        class="px-4 py-3 hover:bg-zinc-500/10 cursor-pointer transition-colors duration-150" @click="openChat(item.id, item.type)">
        <div class="flex justify-between items-center space-x-2">
          <div class="border-r pr-2 mr-3">
            <button class="cursor-pointer" @click.stop="deleteChat(item.id, item.type)">
              <TrashIcon class="text-2xl" />
            </button>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <p class="text-sm font-medium truncate">
                {{ item.title }}
              </p>
            </div>
            <p class="text-sm opacity-70 truncate">
              {{ item.subtitle }}
            </p>
          </div>
          <div class="ml-4 opacity-70 flex-shrink-0">
            <p class="text-xs whitespace-nowrap">
              {{ formatTime(item.time) }}
            </p>
          </div>
        </div>
      </li>
      <li v-else class="w-full flex flex-col space-y-2 py-6 items-center">
        <ChatIcon class="text-9xl" />
        <p class="text-3xl mt-4">NOTHING</p>
        <p>Your chat history is empty!</p>
        <button class="px-3 py-2 rounded border-2 hover:bg-zinc-500/10 cursor-pointer" @click="newChat">Create
          new</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
* {
  font-family: var(--vscode-editor-font-family, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
}
</style>