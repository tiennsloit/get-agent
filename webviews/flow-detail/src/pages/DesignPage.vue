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

            <!-- Replace the simple progress bar with ExplorationProgress component -->
            <ExplorationProgress v-if="currentExplorerResponse"
              :understanding-level="currentExplorerResponse.understanding_level"
              :confidence-score="currentExplorerResponse.confidence_score"
              :iteration="currentExplorerResponse.iteration" :next-priorities="currentExplorerResponse.next_priorities"
              class="mt-4" />
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
      <VueMarkdown v-else-if="!isEditing" :markdown="blueprint" :custom-attrs="customAttrs" class="text-xs vue-markdown"
        :rehype-plugins="[rehypeRaw]">
        <template #code="{ inline, content, ...props }">
          <code v-if="inline" style="color: rgb(230, 153, 191) !important">{{ content }}</code>
          <CodeBlock v-else :code="content" :classes="props.class" />
        </template>
      </VueMarkdown>

      <textarea v-else="isEditing" v-model="editableContent"
        class="w-full h-full min-h-[400px] p-2 font-mono text-xs"></textarea>

      <!-- Empty state -->
      <div v-if="!blueprint && !isAnalyzing && !isExploring && !blueprintGenerating"
        class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <p class="text-lg">No blueprint yet</p>
          <p class="text-sm mt-2">Send a message to start the design process</p>
        </div>
      </div>

      <div v-if="blueprintReady" class="absolute top-20 right-10 flex space-x-2 overflow-hidden text-md font-semibold">
        <button v-if="!isEditing" @click="startEditing"
          class="px-3 py-1.5 rounded-full border border-white/20 cursor-pointer backdrop-blur-xs bg-white/10 hover:bg-white/20 transition-all duration-300 flex space-x-1 items-center shadow-lg">
          <EditSolidIcon />
          <span>Edit</span>
        </button>
        <button v-if="!isEditing" @click="handleStartExecution"
          class="px-3 py-1.5 bg-green-500/20 backdrop-blur-xs rounded-full border border-green-400/30 cursor-pointer hover:bg-green-500/30 hover:border-green-400/50 transition-all duration-300 flex space-x-1 items-center shadow-lg">
          <PlaySolidIcon class="text-lg" />
          <span>Start</span>
        </button>

        <template v-else>
          <button @click="cancelEditing"
            class="px-3 py-1.5 rounded-full border border-white/20 cursor-pointer backdrop-blur-xs bg-white/10 hover:bg-white/20 transition-all duration-300 flex space-x-1 items-center shadow-lg">
            <CloseSolidIcon />
            <span>Cancel</span>
          </button>
          <button @click="saveChanges"
            class="px-3 py-1.5 bg-green-500/20 backdrop-blur-xs rounded-full border border-green-400/30 cursor-pointer hover:bg-green-500/30 hover:border-green-400/50 transition-all duration-300 flex space-x-1 items-center shadow-lg">
            <SaveSolidIcon />
            <span>Save</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CodeBlock from "@/components/CodeBlock.vue";
import { CustomAttrs, VueMarkdown } from "@crazydos/vue-markdown";
import rehypeRaw from 'rehype-raw';
import EditSolidIcon from "@/components/icons/EditSolidIcon.vue";
import PlaySolidIcon from "@/components/icons/PlaySolidIcon.vue";
import SaveSolidIcon from '@/components/icons/SaveSolidIcon.vue';
import CloseSolidIcon from '@/components/icons/CloseSolidIcon.vue';
import ChatMessagesContainer from '@/components/chat/ChatMessagesContainer.vue';
import ChatInput from '@/components/chat/ChatInput.vue';
import ExplorationProgress from '@/components/ExplorationProgress.vue';
import { vscode } from '@/utilities/vscode';
import { useDesignStore } from '@/stores/designStore';
import { useFlowStore } from '@/stores/flowStore';

const designStore = useDesignStore();
const flowStore = useFlowStore();

// Computed properties from store
const messages = computed(() => designStore.messages);
const isAnalyzing = computed(() => designStore.isAnalyzing);
const isExploring = computed(() => designStore.explorerContext.isExploring);
const blueprint = computed(() => designStore.blueprint);
const blueprintGenerating = computed(() => designStore.blueprintGenerating);
const blueprintReady = computed(() => designStore.blueprintReady);

// New computed property to get the current explorer response
const currentExplorerResponse = computed(() => designStore.explorerContext.previousResponse);

// Vars for blueprint editing
const isEditing = ref(false);
const editableContent = ref(blueprint.value || '');

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

const startEditing = () => {
  editableContent.value = blueprint.value || '';
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const saveChanges = () => {
  designStore.saveChanges(editableContent.value);
};

const handleUserMessage = (message: string) => {
  const flowId = flowStore.currentFlow?.id || 'flow-123';
  const flowState = flowStore.currentFlow?.state;
  designStore.sendUserMessage(message, flowId, flowState);
};

const handleStopExploration = () => {
  designStore.stopExploration();
};

const handleStartExecution = () => {
  console.log('[DesignPage] Start execution clicked');
  // Send command to extension to start execution
  vscode.postMessage({
    command: 'startExecution',
    data: {
      flowId: flowStore.currentFlow?.id || 'flow-123'
    }
  });
};
</script>