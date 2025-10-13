<template>
  <div class="flex-1 overflow-y-auto mb-4 max-h-[calc(100vh-200px)]">
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
          <LogStep v-if="message.type === 'log'">{{ message.content }}</LogStep>
          <ThoughtStep v-else-if="message.type === 'thought'">{{ message.content }}</ThoughtStep>
          <AnalysisResult v-else :analysis="message.content" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserMessage from '@/components/UserMessage.vue';
import LogStep from "@/components/agentStep/LogStep.vue";
import ThoughtStep from "@/components/agentStep/ThoughtStep.vue";
import AnalysisResult from './AnalysisResult.vue';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | any;
  type?: 'analysis' | 'log' | 'thought';
}

defineProps<{
  messages: ChatMessage[];
}>();
</script>