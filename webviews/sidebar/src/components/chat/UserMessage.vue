<template>
    <div class="flex justify-end w-full p-2">
        <div class="flex flex-col items-end w-full max-w-[90%]">
            <div class="flex items-center mb-1">
                <span class="text-sm font-semibold chat-name ml-1">You</span>
                <div class="w-6 h-6 chat-avatar flex items-center justify-center text-white rounded-full ml-2">
                    <PersonIcon />
                </div>
            </div>
            <div class="w-full p-3 rounded-xl rounded-br-sm break-words">
                <p @click="handlePatternClick" class="text-right" v-html="highlightPatterns"></p>
                <div v-if="message.snippet" class="mt-2 max-h-48 min-h-12 border rounded flex flex-col">
                    <div class="border-b px-3 py-1 text-xs">Code</div>
                    <div class="flex-1 overflow-scroll" v-highlight>
                        <pre><code>{{ message.snippet }}</code></pre>
                    </div>
                </div>
            </div>

            <div v-if="appStore.chatMode === ChatMode.NORMAL"
                class="h-8 flex select-none items-center space-x-2 justify-end">
                <button @click="copyMessage"
                    class="w-6 h-6 flex items-center justify-center rounded hover:text-green-500 hover:bg-gray-500/30">
                    <CopyIcon />
                </button>
                <button @click="deleteMessage"
                    class="w-6 h-6 flex items-center justify-center rounded hover:text-red-500 hover:bg-gray-500/30">
                    <TrashIcon />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { vscode } from '@/utilities/vscode';
import PersonIcon from '../icons/PersonIcon.vue';
import { computed, type PropType } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAppStore } from '@/stores/app';
import { OutputCommands } from '@/constants/commands';
import CopyIcon from '../icons/CopyIcon.vue';
import TrashIcon from '../icons/TrashIcon.vue';
import { ChatMode } from '@/types/appState';
import type { UserMessage } from '@/types/chat';

const appStore = useAppStore();
const chatStore = useChatStore();

// Get current store based on mode
const getCurrentStore = () => {
    return chatStore;
};
const props = defineProps({
    avatar: {
        type: String,
        default: "https://avatar.iran.liara.run/public"
    },
    message: {
        type: Object as PropType<UserMessage>,
        required: true,
    }
});

// Highlight patterns
const highlightPatterns = computed(() => {
    let result: string = props.message.content;

    // Replace context patterns
    result = result.replace(/@[^\s]+/g, match =>
        `<span class="cursor-pointer context-pattern-block" data-type="context" data-value="${match}">${match}</span>`
    );

    // Replace command patterns
    result = result.replace(
        /\/(test|docstring|review|optimize|explain)\b/gi,
        match => `<span class="cursor-pointer command-pattern-block" data-type="command" data-value="${match}">${match}</span>`
    );

    return result;
});

// Handle pattern click
const handlePatternClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Check if the clicked element is one of our patterns
    if (target.classList.contains('context-pattern-block')) {
        const patternValue = target.dataset.value ?? '';
        handleContextPatternClick(patternValue);
        event.preventDefault();
    }
    else if (target.classList.contains('command-pattern-block')) {
        const patternValue = target.dataset.value ?? '';
        handleCommandPatternClick(patternValue);
        event.preventDefault();
    }
};

const handleContextPatternClick = (pattern: string) => {
    const contextName = pattern.substring(1);
    vscode.postMessage({
        command: OutputCommands.EDIT_FILE,
        data: { path: contextName }
    });
};

const handleCommandPatternClick = (command: string) => { };

// Copy message
const copyMessage = () => {
    navigator.clipboard.writeText(props.message.content);
    vscode.postMessage({ command: OutputCommands.SHOW_ALERT, data: { message: 'Message copied' } });
}

// Delete message from history
const deleteMessage = () => {
    const currentStore = getCurrentStore();
    if (currentStore && 'deleteMessage' in currentStore) {
        currentStore.deleteMessage(props.message.id);
    }
}
</script>