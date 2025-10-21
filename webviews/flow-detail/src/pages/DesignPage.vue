<template>
  <div class="flex-1 w-full px-6 py-4 flex-1 flex space-x-4">
    <div class="flex w-96 flex-col p-4 w-1/2 rounded-2xl border border-gray-500/30">
      <ChatMessagesContainer :messages="messages" />
      <ChatInput :is-analyzing="isAnalyzing" :is-exploring="isExploring" @send="handleUserMessage"
        @stop="handleStopExploration" />
    </div>
    <div class="p-6 flex-2/3 h-full overflow-y-auto rounded-2xl border border-gray-500/30 overflow-auto"
      style="background-image: repeating-linear-gradient(rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px); background-size: 20px 20px;">

      <!-- Loading states -->
      <template v-if="!blueprint">
        <div v-if="isAnalyzing && !isExploring && !blueprintGenerating" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p class="text-lg text-gray-300">Analyzing your request...</p>
          </div>
        </div>

        <div v-else-if="isExploring" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p class="text-lg text-gray-300">Exploring codebase...</p>

            <div class="w-64 mt-4">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress: </span>
                <span>{{ currentIteration }}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${(currentIteration / 20) * 100}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="blueprintGenerating" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p class="text-lg text-gray-300">Generating implementation blueprint...</p>
          </div>
        </div>
      </template>

      <!-- Blueprint content -->
      <VueMarkdown v-else-if="!isEditing" :markdown="blueprint" :custom-attrs="customAttrs"
        class="text-xs vue-markdown" :rehype-plugins="[rehypeRaw]">
        <template #code="{ inline, content, ...props }">
          <code v-if="inline" style="color: rgb(230, 153, 191) !important">{{ content }}</code>
          <CodeBlock v-else :code="content" :classes="props.class" />
        </template>
      </VueMarkdown>

      <textarea v-else="isEditing" v-model="editableContent"
        class="w-full h-full min-h-[400px] p-2 bg-black/30 rounded border border-gray-500/50 font-mono text-sm"></textarea>

      <!-- Empty state -->
      <div v-if="!blueprint && !isAnalyzing && !isExploring && !blueprintGenerating"
        class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <p class="text-lg">No blueprint yet</p>
          <p class="text-sm mt-2">Send a message to start the design process</p>
        </div>
      </div>

      <div v-if="blueprintReady"
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
import { onMounted, onUnmounted, computed } from 'vue';
import CodeBlock from "@/components/CodeBlock.vue";
import { CustomAttrs, VueMarkdown } from "@crazydos/vue-markdown";
import rehypeRaw from 'rehype-raw';
import EditSolidIcon from "@/components/icons/EditSolidIcon.vue";
import PlaySolidIcon from "@/components/icons/PlaySolidIcon.vue";
import SaveSolidIcon from '@/components/icons/SaveSolidIcon.vue';
import CloseSolidIcon from '@/components/icons/CloseSolidIcon.vue';
import ChatMessagesContainer from '@/components/chat/ChatMessagesContainer.vue';
import ChatInput from '@/components/chat/ChatInput.vue';
import { useDesignStore } from '@/stores/designStore';

const designStore = useDesignStore();

// Computed properties from store
const messages = computed(() => designStore.messages);
const isAnalyzing = computed(() => designStore.isAnalyzing);
const isExploring = computed(() => designStore.explorerContext.isExploring);
const currentIteration = computed(() => designStore.explorerContext.currentIteration);
const maxIterations = computed(() => designStore.explorerContext.maxIterations);
const blueprint = computed(() => designStore.blueprint);
const isEditing = computed(() => designStore.isEditing);
const blueprintGenerating = computed(() => designStore.blueprintGenerating);
const blueprintReady = computed(() => designStore.blueprintReady);

// Use v-model for editable content
const editableContent = computed({
  get: () => designStore.editableContent,
  set: (value: string) => designStore.updateEditableContent(value)
});

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

onMounted(() => {
  designStore.initialize();
})

onUnmounted(() => {
  designStore.cleanup();
});

const startEditing = () => {
  designStore.startEditing();
};

const cancelEditing = () => {
  designStore.cancelEditing();
};

const saveChanges = () => {
  designStore.saveChanges();
};

const handleUserMessage = (message: string) => {
  designStore.sendUserMessage(message);
};

const handleStopExploration = () => {
  designStore.stopExploration();
};
</script>