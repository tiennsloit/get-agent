<template>
  <div class="h-full flex flex-col">
    <!-- Search bar -->
    <div class="px-4 pt-4 flex flex-col space-y-3">
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
        <input v-model="searchQuery" type="text" placeholder="Search flows..."
          class="w-full pl-10 pr-4 py-2 border border-gray rounded-md text-white placeholder-white/40 focus:outline-none hover:bg-gray-500/5 focus:bg-gray-500/5"
          @input="handleSearch" />
      </div>
      <button
        class="w-full font-medium py-1.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 cursor-pointer"
        :style="{ background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)' }"
        @click="createNewFlow" :disabled="isLoading">
        <PlusIcon class="w-4 h-4" />
        <span>Create New Flow</span>
      </button>
    </div>

    <!-- Content area -->
    <div class="flex-1 overflow-y-auto">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center p-8">
        <div class="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Content when not loading -->
      <div v-else>
        <!-- In Progress section -->
        <div v-if="inProgressFlows.length > 0" class="p-4">
          <div class="flex">
            <h3 class="text-sm font-semibold text-white/80 mb-3 flex items-center uppercase">
              <ActivityIcon class="w-4 h-4 mr-2" />
              In Progress
            </h3>
          </div>
          <div class="space-y-2">
            <FlowItem v-for="flow in inProgressFlows" :key="flow.id" :flow="flow" @click="handleFlowClick" />
          </div>
        </div>

        <!-- History section -->
        <div v-if="completedFlows.length > 0" class="p-4">
          <h3 class="text-sm font-semibold text-white/80 mb-3 flex items-center uppercase">
            <HistoryIcon class="w-4 h-4 mr-2" />
            History
          </h3>
          <div class="space-y-2">
            <FlowItem v-for="flow in completedFlows" :key="flow.id" :flow="flow" @click="handleFlowClick" />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="inProgressFlows.length === 0 && completedFlows.length === 0"
          class="flex flex-col items-center justify-center p-8 text-center">
          <FlowIcon class="w-16 h-16 text-white/40 mb-4" />
          <h3 class="text-lg font-semibold text-white/80 mb-2">No flows yet</h3>
          <p class="text-sm text-white/60 mb-4">Create your first flow to get started</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlowStore } from '@/stores/flowStore';
import type { FlowListItem } from '@shared/models/flow';
import FlowItem from '@/components/flow/FlowItem.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import ActivityIcon from '@/components/icons/ActivityIcon.vue';
import HistoryIcon from '@/components/icons/HistoryIcon.vue';
import FlowIcon from '@/components/icons/FlowIcon.vue';
import PlusIcon from '@/components/icons/PlusIcon.vue';
import { vscode } from '@/utilities/vscode';
import { WebviewOutputCommands } from '@shared/constants/commands';

// Store
const flowStore = useFlowStore();
const { inProgressFlows, completedFlows, isLoading } = storeToRefs(flowStore);

// Local state
const searchQuery = ref('');

// Methods
const handleSearch = () => {
  flowStore.setSearchQuery(searchQuery.value);
};

const handleFlowClick = (flow: FlowListItem) => {
  // Send message to extension to open flow details page
  vscode.postMessage({
    command: WebviewOutputCommands.OPEN_FLOW_DETAILS,
    data: { flowId: flow.id }
  });
};

const createNewFlow = async () => {
  // Always create a new flow - simplified behavior
  vscode.postMessage({
    command: WebviewOutputCommands.CREATE_FLOW
  });
};

// Lifecycle
onMounted(() => {
  flowStore.refreshFlows();
});
</script>