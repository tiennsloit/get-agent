<template>
  <div
    class="w-full overflow-hidden p-2 flex items-center space-x-2 rounded-lg border border-gray-500/40 hover:bg-gray-500/5 cursor-pointer transition-all duration-200 group"
    @click="handleClick">
    <div class="h-8 w-8 grow-0 shrink-0 rounded-full relative">
      <div v-if="state === FlowState.TODO" class="absolute inset-0 rounded-full border-2 border-gray-500">
      </div>
      <div v-else-if="[FlowState.EXECUTING, FlowState.REPORTING, FlowState.DESIGNING].includes(state)"
        class="text-green-500 absolute inset-0 rounded-full border-2 border-gray-500/20 border-t-white/70 animate-spin">
      </div>
      <div v-else-if="state === FlowState.PAUSED"
        class="text-amber-500 absolute inset-0 rounded-full border-2 border-amber-500 flex items-center justify-center">
        <PauseIcon class="text-xl" />
      </div>
      <div v-else-if="state === FlowState.COMPLETED"
        class="text-green-500 absolute inset-0 rounded-full border-2 border-green-500 flex items-center justify-center">
        <CheckIcon2 class="text-xl" />
      </div>
      <div v-else-if="state === FlowState.CANCELLED"
        class="text-gray-500 absolute inset-0 rounded-full border-2 border-gray-500 flex items-center justify-center">
        <CloseIcon class="text-lg" />
      </div>
      <div v-else
        class="absolute inset-0 rounded-full border-2 border-gray-500/20 border-t-white/70 flex items-center justify-center animate-spin">
      </div>
    </div>
    <div class="grow overflow-hidden flex flex-col space-y-1.5">
      <!-- Header -->
      <div class="flex overflow-hidden w-full items-center justify-between">
        <div class="font-medium truncate grow mr-2">
          {{ truncatedTitle }}
        </div>
        <div class="text-xs grow-0 text-nowrap">
          {{ formatTime(flow.lastUpdated) }}
        </div>
      </div>

      <!-- Progress -->
      <div class="w-full flex overflow-hidden space-x-4 h-5">
        <small class="grow text-xs">
          {{ getStateLabel(state) }}
        </small>
        <div class="w-20 flex space-x-2 items-center group-hover:hidden">
          <div class="grow flex bg-gray-700 rounded-full h-1">
            <div class="h-1 grow rounded-full transition-all duration-300 bg-white/70"
              :style="{ width: `${progressPercentage}%` }"></div>
          </div>
          <small>{{ flow.progress.done }}/{{ flow.progress.total }}</small>
        </div>
        <div class="w-20 hidden group-hover:flex space-x-1 items-center justify-end">
          <button @click.stop="handleRename"
            class="p-1 hover:bg-gray-600/50 rounded transition-colors flex items-center justify-center">
            <EditIcon class="text-sm" />
          </button>
          <button @click.stop="handleDelete"
            class="p-1 hover:bg-red-600/50 rounded transition-colors flex items-center justify-center">
            <TrashIcon class="text-sm" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FlowState, type FlowListItem } from '@/types/flow';
import { useConfirmation } from '@/composables/useConfirmation';
import { useFlowStore } from '@/stores/flowStore';
import { vscode } from '@/utilities/vscode';
import { OutputCommands } from '@/constants/commands';
import CheckIcon2 from '../icons/CheckIcon2.vue';
import CloseIcon from '../icons/CloseIcon.vue';
import PauseIcon from '../icons/PauseIcon.vue';
import EditIcon from '../icons/EditIcon.vue';
import TrashIcon from '../icons/TrashIcon.vue';

interface Props {
  flow: FlowListItem;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [flow: FlowListItem];
}>();

// Composables
const { confirm } = useConfirmation();
const flowStore = useFlowStore();

// Computed
const truncatedTitle = computed(() => {
  return props.flow.title.length > 30
    ? props.flow.title.substring(0, 30) + '...'
    : props.flow.title;
});

const state = computed(() => {
  return props.flow.state as FlowState;
});

const progressPercentage = computed(() => {
  if (props.flow.progress.total === 0) return 0;
  return Math.round((props.flow.progress.done / props.flow.progress.total) * 100);
});

// Methods
const handleClick = () => {
  emit('click', props.flow);
};

const handleRename = async () => {
  // Send rename event directly to extension - extension will handle showing prompt
  vscode.postMessage({
    command: OutputCommands.RENAME_FLOW,
    data: {
      flowId: props.flow.id
    }
  });
};

const handleDelete = async () => {
  const isConfirmed = await confirm({
    title: 'Delete Flow',
    message: `Are you sure you want to delete "${props.flow.title}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });

  if (isConfirmed) {
    await flowStore.deleteFlow(props.flow.id);
  }
};

const getStateLabel = (state: string): string => {
  const labels: Record<string, string> = {
    'to-do': 'To Do',
    'designing': 'Designing',
    'executing': 'Executing',
    'reporting': 'Reporting',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'paused': 'Paused'
  };
  return labels[state] || state;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};
</script>