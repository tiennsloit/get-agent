<template>
  <div class="flex-1 w-full px-6 py-4 flex-1 flex space-x-4">
    <div class="flex w-96 flex-col p-4 w-1/2 rounded-2xl border border-gray-500/30">
      <ChatMessagesContainer :messages="messages" />
      <ChatInput 
        :is-analyzing="isAnalyzing" 
        @send="handleUserMessage"
        @keydown="handleKeyDown"
      />
    </div>
    <div class="p-6 flex-2/3 h-full overflow-y-auto rounded-2xl border border-gray-500/30 overflow-auto"
      style="background-image: repeating-linear-gradient(rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px); background-size: 20px 20px;">
      <VueMarkdown v-if="!isEditing" :markdown="blueprint" :custom-attrs="customAttrs" class="text-xs vue-markdown"
        :rehype-plugins="[rehypeRaw]">
        <template #code="{ inline, content, ...props }">
          <code v-if="inline" style="color: rgb(230, 153, 191) !important">{{ content }}</code>
          <CodeBlock v-else :code="content" :classes="props.class" />
        </template>
      </VueMarkdown>

      <textarea v-else v-model="editableContent"
        class="w-full h-full min-h-[400px] p-2 bg-black/30 rounded border border-gray-500/50 font-mono text-sm"></textarea>

      <div
        class="absolute bg-black text-md font-semibold top-20 right-10 flex rounded-full border border-white/50 overflow-hidden">
        <button v-if="!isEditing" @click="startEditing"
          class="px-3 py-1.5 rounded-l-full cursor-pointer hover:bg-white/20 transition-colors flex space-x-2 items-center">
          <EditSolidIcon />
          <span>Edit</span>
        </button>
        <button v-if="!isEditing"
          class="px-3 py-1.5 bg-green-500/50 rounded-r-full cursor-pointer hover:bg-green-500/70 transition-colors flex space-x-2 items-center">
          <PlaySolidIcon class="text-lg" />
          <span>Start</span>
        </button>

        <template v-else>
          <button @click="cancelEditing"
            class="px-3 py-1.5 rounded-l-full cursor-pointer hover:bg-white/20 transition-colors flex space-x-2 items-center">
            <CloseSolidIcon />
            <span>Cancel</span>
          </button>
          <div class="w-px bg-white/50"></div>
          <button @click="saveChanges"
            class="px-3 py-1.5 bg-green-500/50 rounded-r-full cursor-pointer hover:bg-green-500/70 transition-colors flex space-x-2 items-center">
            <SaveSolidIcon />
            <span>Save</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import CodeBlock from "@/components/CodeBlock.vue";
import { CustomAttrs, VueMarkdown } from "@crazydos/vue-markdown";
import rehypeRaw from 'rehype-raw';
import designDocument from './sample-blueprint.txt?raw';
import EditSolidIcon from "@/components/icons/EditSolidIcon.vue";
import PlaySolidIcon from "@/components/icons/PlaySolidIcon.vue";
import SaveSolidIcon from '@/components/icons/SaveSolidIcon.vue';
import CloseSolidIcon from '@/components/icons/CloseSolidIcon.vue';
import { mockStream } from '@/utilities/mockStream';
import { vscode } from '@/utilities/vscode';

// Import new components
import ChatMessagesContainer from '@/components/chat/ChatMessagesContainer.vue';
import ChatInput from '@/components/chat/ChatInput.vue';

// Message types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | any;
  type?: 'analysis' | 'log' | 'thought';
}

const isEditing = ref(false);
const editableContent = ref(designDocument);
const blueprint = ref('');
const customAttrs: CustomAttrs = {
  // use html tag name as key
  h1: { class: ['text-xl', 'font-bold mb-4'] },
  h2: { class: ['text-lg', 'font-bold my-2'] },
  h3: { class: ['text-base', 'font-bold my-2'] },
  li: { class: ['list-disc ml-4 my-1'] },
  ul: { class: ['ml-2 my-2'] },
  ol: { class: ['ml-2 my-2'] },
  hr: { class: ['my-4 opacity-50'] }
}

// Chat state
const messages = ref<ChatMessage[]>([]);
const isAnalyzing = ref(false);

onMounted(() => {
  mockStream(blueprint, designDocument);
})

const startEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  editableContent.value = designDocument; // Reset to original content
};

const saveChanges = () => {
  // In a real implementation, you would save the content here
  // For now, we'll just exit edit mode
  isEditing.value = false;
  // TODO: Implement actual save functionality
};

// Chat functionality
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    // The actual sending is handled by the ChatInput component
  }
};

const handleUserMessage = (message: string) => {
  if (!message || isAnalyzing.value) return;

  // Add user message to chat
  messages.value.push({ role: 'user', content: message });

  // Show loading indicator
  isAnalyzing.value = true;

  // Send message to extension
  vscode.postMessage({
    command: 'analyzeUserRequest',
    data: {
      flowId: 'flow-123',
      userRequest: message
    }
  });
};

const mockLogs = () => {
  try {
    // Mock streaming logs and thoughts
    let logIndex = 0;
    const mockLogs = [
      "Analyzing flow structure...",
      "Identifying core components...",
      "Evaluating integration points...",
      "Assessing complexity factors..."
    ];

    const mockThoughts = [
      "Let me break down this request into manageable parts.",
      "I should consider the existing architecture patterns.",
      "This might require changes to the data flow logic.",
      "I'll need to verify the implementation approach."
    ];

    const logInterval = setInterval(() => {
      if (logIndex < mockLogs.length) {
        messages.value.push({
          role: 'assistant',
          type: 'log',
          content: mockLogs[logIndex]
        });
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 1000);

    let thoughtIndex = 0;
    const thoughtInterval = setInterval(() => {
      if (thoughtIndex < mockThoughts.length) {
        messages.value.push({
          role: 'assistant',
          type: 'thought',
          content: mockThoughts[thoughtIndex]
        });
        thoughtIndex++;
      } else {
        clearInterval(thoughtInterval);
      }
    }, 1500);
  } catch (e) {
    console.log(e);
  }
};

// Handle messages from extension
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
    case 'analyzeUserResponse':
      // Add analysis response
      messages.value.push({
        role: 'assistant',
        type: 'analysis',
        content: message.data.analysis
      });

      isAnalyzing.value = false;
      mockLogs();
      break;
  }
});
</script>