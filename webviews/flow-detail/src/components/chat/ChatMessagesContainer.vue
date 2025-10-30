<template>
  <div ref="scrollContainer" class="flex-1 overflow-y-auto mb-4 max-h-[calc(100vh-200px)]">
    <div v-if="messages.length === 0" class="w-full h-full flex flex-col space-y-2 items-center justify-center text-center">
      <h1 class="text-2xl font-medium">
        What can GoNext help you with?
      </h1>
      <sub class="text-sm font-light opacity-70">Ask me to analyze your request or provide implementation
        guidance</sub>
    </div>
    <div v-else class="flex flex-col space-y-4">
      <div v-for="(message, index) in messages" :key="'design-chat-message-' + index">
        <UserMessage v-if="message.role === 'user'" :message="message.content" />
        <template v-else>
          <LoadingMessage v-if="message.type === 'loading'" />
          <LogStep v-else-if="message.type === 'log'">{{ message.content }}</LogStep>
          <ThoughtStep v-else-if="message.type === 'thought'" class="text-xs">
            {{ message.content }}
          </ThoughtStep>
          <AnalysisResult v-else :analysis="message.content" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import UserMessage from '@/components/UserMessage.vue';
import LogStep from "@/components/agentStep/LogStep.vue";
import ThoughtStep from "@/components/agentStep/ThoughtStep.vue";
import AnalysisResult from './AnalysisResult.vue';
import LoadingMessage from './LoadingMessage.vue';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | any;
  type?: 'analysis' | 'log' | 'thought' | 'loading' | 'action_result';
  metadata?: any;
}

const props = defineProps<{
  messages: ChatMessage[];
}>();

const scrollContainer = ref<HTMLElement | null>(null);

// Scroll to bottom function
const scrollToBottom = () => {
  if (scrollContainer.value) {
    nextTick(() => {
      scrollContainer.value!.scrollTop = scrollContainer.value!.scrollHeight;
    });
  }
};

// Watch for messages changes and auto-scroll
watch(
  () => props.messages,
  () => {
    scrollToBottom();
  },
  {
    deep: true,
    flush: 'post'
  }
);
</script>