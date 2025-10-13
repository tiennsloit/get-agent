<template>
    <div class="flex-1 w-full px-6 py-4 flex-1 flex space-x-4">
        <div class="p-4 border border-gray-500/30 h-fit w-96 rounded-2xl">
            <div class="text-lg font-semibold mb-4">To-dos</div>

            <div v-if="todos.length > 0" class="h-full w-full space-y-2 overflow-hidden">
                <div v-for="(todo, index) in todos" :key="index"
                    class="rounded-lg flex items-center space-x-2 cursor-pointer hover:text-white"
                    v-bind:class="{ 'text-white': todo.state === 'doing', 'text-white/50': ['done', 'todo'].includes(todo.state) }">
                    <div v-if="todo.state === 'todo'" class="h-3 w-3 rounded-full border border-white/30"></div>
                    <div v-else-if="todo.state === 'doing'"
                        class="h-3 w-3 rounded-full border border-white/30 border-t-white animate-spin">
                    </div>
                    <div v-else-if="todo.state === 'done'"
                        class="h-3 w-3 rounded-full border flex justify-center items-center">
                        <CheckSolidIcon />
                    </div>
                    <div class="font-medium">{{ todo.content }}
                    </div>
                </div>
            </div>
            <div v-else class="h-full w-full space-y-4 animate-pulse overflow-hidden">
                <div v-for="i in 5" :key="i" class="w-full h-10 bg-gray-500/30 rounded-lg"></div>
            </div>
        </div>
        <div ref="scrollContainer" class="p-6 flex-2/3 h-full overflow-y-auto rounded-2xl border border-gray-500/30">
            <TransitionGroup v-if="steps.length > 0" class="space-y-2" name="expand-y" tag="div">
                <div v-for="(step, index) in steps" :key="'step-' + index">
                    <AgentStep :step="step" />
                </div>
                <div v-if="!isStopGenerated" class="flex justify-start items-center w-full mt-2 h-10">
                    <div class="flex justify-start space-x-1">
                        <div class="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-white/50 rounded-full animate-bounce" style="animation-delay: 0.2s;">
                        </div>
                        <div class="w-2 h-2 bg-white/50 rounded-full animate-bounce" style="animation-delay: 0.4s;">
                        </div>
                    </div>
                </div>
            </TransitionGroup>
            <div v-else class="h-full w-full space-y-4 animate-pulse overflow-hidden">
                <div class="space-y-2">
                    <div v-for="i in 30" :key="i" class="w-full h-10 bg-gray-500/30 rounded-lg"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Todo {
    content: string;
    state: 'todo' | 'doing' | 'done';
}

import AgentStep from '@/components/agentStep/AgentStep.vue';
import CheckSolidIcon from '@/components/icons/CheckSolidIcon.vue';
import { ref, onMounted, nextTick, watch } from 'vue';

const mockSteps = [
    {
        "type": "log",
        "content": "Read index.ts",
        "timestamp": "2024-04-05T10:30:01Z"
    },
    {
        "type": "log",
        "content": "Read messageListener.ts",
        "timestamp": "2024-04-05T10:30:02Z"
    },
    {
        "type": "log",
        "content": "Read sidebar.ts",
        "timestamp": "2024-04-05T10:30:03Z"
    },
    {
        "type": "thought",
        "content": "Now I have a good understanding of the existing architecture. Let me start implementing the Flow feature based on the design document.",
        "timestamp": "2024-04-05T10:30:05Z"
    },
    {
        "type": "thought",
        "content": "Let me create the TypeScript type definitions for the Flow feature:",
        "timestamp": "2024-04-05T10:30:07Z"
    },
    {
        "type": "file-change",
        "filename": "flow.ts",
        "language": "TS",
        "action": "A",
        "linesAdded": 173,
        "status": "Applied",
        "path": "src/flow.ts",
        "timestamp": "2024-04-05T10:30:10Z"
    },
    {
        "type": "thought",
        "content": "Now let me extend the appState types to include Flow tab:",
        "timestamp": "2024-04-05T10:30:12Z"
    },
    {
        "type": "file-change",
        "filename": "appState.ts",
        "language": "TS",
        "action": "M",
        "linesAdded": 1,
        "status": "Applied",
        "path": "src/appState.ts",
        "timestamp": "2024-04-05T10:30:15Z"
    },
    {
        "type": "thought",
        "content": "Now let me extend the commands to include Flow-related commands:",
        "timestamp": "2024-04-05T10:30:18Z"
    },
    {
        "type": "file-change",
        "filename": "commands.ts",
        "language": "TS",
        "action": "M",
        "linesAdded": 6,
        "status": "Applied",
        "path": "src/commands.ts",
        "timestamp": "2024-04-05T10:30:20Z"
    },
    {
        "type": "file-change",
        "filename": "commands.ts",
        "language": "TS",
        "action": "M",
        "linesAdded": 11,
        "status": "Applied",
        "path": "src/commands.ts",
        "timestamp": "2024-04-05T10:30:22Z"
    },
    {
        "type": "thought",
        "content": "Now I'll create the FlowListStore for sidebar flow management. First, let me create the directory structure:",
        "timestamp": "2024-04-05T10:30:28Z"
    },
    {
        "type": "terminal-command",
        "command": "mkdir -p /Users/hiens/Development/gonext/webviews/sidebar/src/stores/flowList",
        "output": "Directory created successfully\nCreated directory: /Users/hiens/Development/gonext/webviews/sidebar/src/stores/flowList\n\nThis directory will contain the FlowListStore implementation files:\n- state.ts: Contains the initial state definition for the flow list store\n- getters.ts: Contains computed properties and state accessors\n- actions.ts: Contains business logic and async operations\n- index.ts: Store module entry point and registration\n\nThe FlowListStore will manage:\n- Flow list state (loading, error, data)\n- Active flow selection\n- Flow creation and deletion operations\n- Flow search and filtering functionality\n- Synchronization with backend flow data\n\nNext steps:\n1. Implement state.ts with proper TypeScript interfaces\n2. Create getters for flow list computations\n3. Develop actions for CRUD operations\n4. Set up store module registration\n5. Connect to sidebar component data flow",
        "status": "executed",
        "timestamp": "2024-04-05T10:30:30Z"
    },
    {
        "type": "file-change",
        "filename": "state.ts",
        "language": "TS",
        "action": "A",
        "linesAdded": 10,
        "status": "Applied",
        "path": "webviews/sidebar/src/stores/flowList/state.ts",
        "timestamp": "2024-04-05T10:30:35Z"
    },
    {
        "type": "file-change",
        "filename": "getters.ts",
        "language": "TS",
        "action": "A",
        "linesAdded": 79,
        "status": "Applied",
        "path": "webviews/sidebar/src/stores/flowList/getters.ts",
        "timestamp": "2024-04-05T10:30:38Z"
    },
    {
        "type": "file-change",
        "filename": "actions.ts",
        "language": "TS",
        "action": "A",
        "linesAdded": 163,
        "status": "Applied",
        "path": "webviews/sidebar/src/stores/flowList/actions.ts",
        "timestamp": "2024-04-05T10:30:40Z"
    },
    {
        "type": "file-change",
        "filename": "index.ts",
        "language": "TS",
        "action": "A",
        "linesAdded": 14,
        "status": "Applied",
        "path": "webviews/sidebar/src/stores/flowList/index.ts",
        "timestamp": "2024-04-05T10:30:42Z"
    },
    ...Array(20).fill(null).map((_, i) => ({
        "type": i % 3 === 0 ? "thought" : i % 3 === 1 ? "log" : "file-change",
        "content": `Mock step ${i + 1} content for testing purposes`,
        "timestamp": new Date(Date.now() + i * 1000).toISOString(),
        "filename": i % 3 === 2 ? `mock-file-${i}.ts` : undefined,
        "language": i % 3 === 2 ? "TS" : undefined,
        "action": i % 3 === 2 ? (i % 6 === 0 ? "A" : "M") : undefined,
        "linesAdded": i % 3 === 2 ? Math.floor(Math.random() * 100) : undefined,
        "status": i % 3 === 2 ? (i % 2 === 0 ? "Applied" : "Pending") : undefined,
        "path": i % 3 === 2 ? `src/mock-file-${i}.ts` : undefined
    }))
];

const todos = ref<Todo[]>([]);
const steps = ref<any>([]);
const isStopGenerated = ref(false);

// Refs for scroll functionality
const scrollContainer = ref<HTMLElement | null>(null);

// Scroll to bottom function
const scrollToBottom = () => {
    if (scrollContainer.value) {
        nextTick(() => {
            scrollContainer.value!.scrollTop = scrollContainer.value!.scrollHeight;
        });
    }
};

// Watch for steps changes and scroll to bottom
watch(
    steps,
    () => {
        scrollToBottom();
    },
    {
        flush: 'post'
    }
);

onMounted(() => {
    setTimeout(() => {
        todos.value = [
            {
                content: 'Implement the todo functionality',
                state: 'done'
            },
            {
                content: 'Design the UI',
                state: 'doing'
            },
            {
                content: 'Write tests',
                state: 'todo'
            }
        ];

        // Mock execution
        executeMockSteps();
    }, 1000);
});

const executeMockSteps = async () => {
    for (let i = 0; i < mockSteps.length; i++) {
        steps.value = [
            ...steps.value,
            mockSteps[i]
        ];
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    isStopGenerated.value = true;
}
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
