<template>
  <div class="border border-gray-500/50 bg-white/10 rounded-lg">
    <textarea v-model="userInput" placeholder="Ask anything..." class="px-2 pt-3 w-full resize-none"
      @keydown.enter="handleKeyDown" :disabled="isExploring"></textarea>
    <div class="px-2 pb-2 flex items-center justify-between">
      <div class="flex-1 flex space-x-2">
        <div
          class="w-7 h-7 text-md flex items-center justify-center hover:bg-white/20 cursor-pointer rounded-full border border-gray">
          <FileSolidIcon />
        </div>
      </div>
      <button 
        v-if="!isExploring"
        @click="sendUserRequest" 
        class="text-black px-4 py-2 rounded-lg cursor-pointer"
        :style="{ background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)' }"
        :disabled="isAnalyzing || !userInput.trim()">
        <SendSolidIcon />
      </button>
      <button 
        v-else
        @click="stopExploration" 
        class="text-white px-4 py-2 rounded-lg cursor-pointer bg-red-500 hover:bg-red-600">
        <span class="text-sm font-medium">Stop Exploration</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileSolidIcon from '@/components/icons/FileSolidIcon.vue';
import SendSolidIcon from '@/components/icons/SendSolidIcon.vue';

const userInput = ref('');

const emit = defineEmits<{
  (e: 'send', message: string): void;
  (e: 'stop'): void;
}>();

const sendUserRequest = () => {
  const message = userInput.value.trim();
  if (message) {
    emit('send', message);
    userInput.value = '';
  }
};

const stopExploration = () => {
  emit('stop');
};

const handleKeyDown = () => {
  if (!props.isExploring) {
    sendUserRequest();
  }
};

const props = defineProps<{
  isAnalyzing: boolean;
  isExploring?: boolean;
}>();
</script>