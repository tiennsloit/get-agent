<template>
  <div class="h-full w-full flex flex-col">
    <!-- Messages container -->
    <ChatMessages :messages="messages" :is-advanced="false" />

    <!-- Input area -->
    <SharedChatInput :is-loading="isLoading" @send="sendMessage" @stop="stopMessage" ref="chatInputRef">
      <template #context-selector>
        <ModelSelector />
      </template>
    </SharedChatInput>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import ModelSelector from './ModelSelector.vue'
import ChatMessages from './ChatMessages.vue'
import SharedChatInput from './SharedChatInput.vue'
import type { AssistantMessage, UserMessage } from '@/types/chat'

// Component state
const chatStore = useChatStore()
const messages = computed((): Array<AssistantMessage | UserMessage> => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)
const chatInputRef = ref()


// Send message function
const sendMessage = async (message: string): Promise<void> => {
  chatStore.submitPrompt(message)
}

// Stop message function
const stopMessage = async (): Promise<void> => {
  chatStore.stopGeneration()
}

</script>