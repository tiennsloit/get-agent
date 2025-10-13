<template>
  <main class="h-screen w-full flex flex-col">
    <!-- Tab bar -->
    <div class="flex border-b border-white/20">
      <button
        class="cursor-pointer flex-1 px-4 py-3 text-sm font-medium text-center transition-colors duration-200 border-b-2"
        :class="{
          'border-white text-white': chatMode === ChatMode.NORMAL,
          'border-transparent text-white/50 hover:bg-gray-500/10': chatMode !== ChatMode.NORMAL
        }" @click="switchMode(ChatMode.NORMAL)">
        Chat
      </button>
      <button
        class="cursor-pointer flex-1 px-4 py-3 text-sm font-medium text-center transition-colors duration-200 border-b-2"
        :class="{
          'border-white text-white': chatMode === ChatMode.FLOW,
          'border-transparent text-white/50 hover:bg-gray-500/10': chatMode !== ChatMode.FLOW
        }" @click="switchMode(ChatMode.FLOW)">
        Flow
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <Chat v-if="chatMode === ChatMode.NORMAL" />
      <FlowPage v-else-if="chatMode === ChatMode.FLOW" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { ChatMode } from '@/types/appState'
import Chat from '@/components/chat/Chat.vue'
import FlowPage from '@/pages/FlowPage.vue'

// Component state
const appStore = useAppStore()
const { chatMode } = storeToRefs(appStore)

/**
 * Switch between different modes
 */
const switchMode = (mode: ChatMode) => {
  appStore.copyWith({
    chatMode: mode
  })
}
</script>
