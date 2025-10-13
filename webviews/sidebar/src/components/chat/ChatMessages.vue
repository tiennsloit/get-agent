<template>
  <div v-if="messages?.length" class="flex-1 flex flex-col space-y-3 p-2 overflow-x-hidden overflow-y-auto"
    ref="scrollContainer">
    <template v-for="message in messages" :key="message.id">
      <UserMessageComp v-if="message.role === 'user'" :message="message" />
      <ChatAssistantMessageComp v-else :message="message as AssistantMessage" />
    </template>
  </div>
  <div v-else class="flex-1 overflow-x-hidden overflow-y-auto flex flex-col space-y-3 px-6 py-10">
    <ChatWelcome :is-advanced="false" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import UserMessageComp from './UserMessage.vue'
import ChatAssistantMessageComp from './AssistantMessage.vue'
import ChatWelcome from './ChatWelcome.vue'
import type { AssistantMessage, UserMessage } from '@/types/chat'

const props = defineProps<{
  messages: Array<AssistantMessage | UserMessage>
  isAdvanced: boolean
}>()

const scrollContainer = ref<HTMLElement | null>(null)

// Scroll to bottom when new messages arrive
watch(
  () => props.messages,
  async () => {
    await nextTick();
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
  },
  { deep: true }
)

// Always scroll to bottom on component mount
onMounted(async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
})
</script>