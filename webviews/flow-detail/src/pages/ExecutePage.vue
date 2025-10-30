<template>
    <div class="flex-1 px-6 py-4 flex-1 flex space-x-4">
        <div class="p-4 border border-gray-500/30 h-fit h-full rounded-2xl overflow-x-hidden">
            <div class="text-lg font-semibold mb-4">Todos</div>

            <!-- Loading state for TODO list -->
            <div v-if="isLoadingTodos" class="h-full w-full space-y-4 animate-pulse">
                <div v-for="i in 5" :key="i" class="w-full h-10 bg-gray-500/30 rounded-lg"></div>
            </div>

            <!-- Error state -->
            <div v-else-if="todoError" class="text-red-400">
                <p class="mb-2">{{ todoError }}</p>
                <button @click="handleRetryTodoGeneration"
                    class="px-3 py-1.5 bg-red-500/20 backdrop-blur-xs rounded-full border border-red-400/30 cursor-pointer hover:bg-red-500/30 transition-all">
                    Retry
                </button>
            </div>

            <!-- TODO list -->
            <div v-else-if="todoItems.length > 0"
                class="max-h-full w-96 pb-10 space-y-2 flex flex-col overflow-y-auto -mx-4 px-4 text-xs">
                <template v-for="(item, index) in todoItems" :key="index">
                    <!-- Simple task item -->
                    <div v-if="item.type === 'task'"
                        class="rounded-lg flex items-center space-x-2 cursor-pointer hover:text-white" :class="{
                            'text-white': getTodoState(index) === 'inprogress',
                            'text-white/50': ['done', 'todo'].includes(getTodoState(index))
                        }">
                        <div v-if="getTodoState(index) === 'todo'" class="h-3 w-3 rounded-full border border-white/30">
                        </div>
                        <div v-else-if="getTodoState(index) === 'inprogress'"
                            class="h-3 w-3 rounded-full border border-white/30 border-t-white animate-spin">
                        </div>
                        <div v-else-if="getTodoState(index) === 'done'"
                            class="h-3 w-3 rounded-full border flex justify-center items-center">
                            <CheckSolidIcon />
                        </div>
                        <div class="font-medium">{{ item.content }}</div>
                    </div>

                    <!-- Phase item with nested tasks -->
                    <div v-else-if="item.type === 'phase'" class="space-y-2 grow">
                        <div class="font-semibold text-white/80 flex items-center space-x-2">
                            <div v-if="getTodoState(index) === 'todo'"
                                class="h-3 w-3 rounded-full border border-white/30"></div>
                            <div v-else-if="getTodoState(index) === 'inprogress'"
                                class="h-3 w-3 rounded-full border border-white/30 border-t-white animate-spin">
                            </div>
                            <div v-else-if="getTodoState(index) === 'done'"
                                class="h-3 w-3 rounded-full border flex justify-center items-center">
                                <CheckSolidIcon />
                            </div>
                            <span>{{ item.name }}</span>
                        </div>
                        <div class="pl-4 space-y-1">
                            <div v-for="(task, taskIndex) in item.tasks" :key="taskIndex"
                                class="text-xs text-white/50 flex space-x-2">
                                <div class="h-3 w-3 mt-1 flex-none rounded-full border border-white/30"></div>
                                <div class="grow">{{ task }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Empty state -->
            <div v-else class="text-gray-400 text-center py-4">
                <p>No tasks generated yet</p>
            </div>
        </div>

        <div ref="scrollContainer" class="p-6 flex-2/3 h-full overflow-y-auto rounded-2xl border border-gray-500/30">
            <!-- Agent steps display -->
            <TransitionGroup v-if="agentSteps.length > 0" class="space-y-2" name="expand-y" tag="div">
                <div v-for="(step, index) in agentSteps" :key="'step-' + index">
                    <AgentStep :step="step" />
                </div>
                <div v-if="isExecuting" class="flex justify-start items-center w-full mt-2 h-10">
                    <div class="flex justify-start space-x-1">
                        <div class="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-white/50 rounded-full animate-bounce" style="animation-delay: 0.2s;">
                        </div>
                        <div class="w-2 h-2 bg-white/50 rounded-full animate-bounce" style="animation-delay: 0.4s;">
                        </div>
                    </div>
                </div>
            </TransitionGroup>

            <!-- Empty state for agent steps -->
            <div v-else class="h-full w-full flex items-center justify-center">
                <div class="text-center text-gray-400">
                    <p class="text-lg">Waiting for execution to start...</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import AgentStep from '@/components/agentStep/AgentStep.vue';
import CheckSolidIcon from '@/components/icons/CheckSolidIcon.vue';
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useExecuteStore } from '@/stores/executeStore';
import { useFlowStore } from '@/stores/flowStore';

const executeStore = useExecuteStore();
const flowStore = useFlowStore();

// Computed properties from store
const todoItems = computed(() => executeStore.todoItems);
const isLoadingTodos = computed(() => executeStore.isLoadingTodos);
const todoError = computed(() => executeStore.todoError);
const agentSteps = computed(() => executeStore.agentSteps);
const isExecuting = computed(() => executeStore.isExecuting);

// Refs for scroll functionality
const scrollContainer = ref<HTMLElement | null>(null);

// Get TODO state helper
const getTodoState = (index: number): 'todo' | 'inprogress' | 'done' => {
    return executeStore.getTodoState(index);
};

// Scroll to bottom function
const scrollToBottom = () => {
    if (scrollContainer.value) {
        nextTick(() => {
            scrollContainer.value!.scrollTop = scrollContainer.value!.scrollHeight;
        });
    }
};

// Watch for agent steps changes and scroll to bottom
watch(
    agentSteps,
    () => {
        scrollToBottom();
    },
    {
        flush: 'post'
    }
);

// Handle retry TODO generation
const handleRetryTodoGeneration = () => {
    const flowId = flowStore.currentFlow?.id || 'flow-123';
    executeStore.retryTodoGeneration(flowId);
};

onMounted(() => {
    executeStore.initialize();
});

onUnmounted(() => {
    executeStore.cleanup();
});
</script>

<style scoped>
.expand-y-enter-active,
.expand-y-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.expand-y-enter-from {
    opacity: 0;
    transform: translateY(30px);
    max-height: 0;
}

.expand-y-enter-to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
}

.expand-y-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
}

.expand-y-leave-to {
    opacity: 0;
    transform: translateY(30px);
    max-height: 0;
}

.expand-y-move {
    transition: transform 0.3s ease;
}
</style>
