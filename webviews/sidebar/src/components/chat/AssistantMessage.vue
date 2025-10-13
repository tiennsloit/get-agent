<template>
    <div class="flex justify-start w-full p-2">
        <div class="flex flex-col items-start w-full">
            <div class="flex items-center mb-1">
                <div class="w-6 h-6 chat-avatar flex items-center justify-center text-white rounded-full ml-2">
                    <SparkleIcon />
                </div>
                <span class="text-sm font-semibold chat-name ml-1">{{ name }}</span>
            </div>

            <AssistantMessageContent :content="message.content" :key="message.id" />

            <div v-if="message.state === MessageState.DONE"
                class="w-full h-8 flex select-none border-t border-gray border-dashed pt-2 mt-2">
                <div class="flex-1 flex space-x-2">
                    <button @click="regenerateMessage"
                        class="w-6 h-6 flex items-center justify-center rounded hover:text-orange-500 hover:bg-gray-500/30">
                        <ReloadIcon />
                    </button>
                    <button @click="copyMessage"
                        class="w-6 h-6 flex items-center justify-center rounded hover:text-green-500 hover:bg-gray-500/30">
                        <CopyIcon />
                    </button>
                    <button @click="deleteMessage"
                        class="w-6 h-6 flex items-center justify-center rounded hover:text-red-500 hover:bg-gray-500/30">
                        <TrashIcon />
                    </button>
                </div>
                <div v-if="message.metadata" class="flex items-center">
                    <p class="text-muted text-xs chat-name">
                        <span>{{ message.metadata.tokens }} tokens •</span>
                        <span>{{ message.metadata.time.toFixed(1) }}s</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import SparkleIcon from '../icons/SparkleIcon.vue';
import CopyIcon from '../icons/CopyIcon.vue';
import ReloadIcon from '../icons/ReloadIcon.vue';
import TrashIcon from '../icons/TrashIcon.vue';
import { type PropType } from 'vue';
import { useChatStore } from '@/stores/chat';
import AssistantMessageContent from './AssistantMessageContent.vue';
import { vscode } from '@/utilities/vscode';
import { OutputCommands } from '@/constants/commands';
import { MessageState, type AssistantMessage } from '@/types/chat';

const chatStore = useChatStore();

const props = defineProps({
    avatar: {
        type: String,
        default: "https://img.icons8.com/dotty/256/sparkling.png"
    },
    name: {
        type: String,
        default: "GoNext"
    },
    message: {
        type: Object as PropType<AssistantMessage>,
        required: true
    }
})

// Regenerate message
const regenerateMessage = () => {
    chatStore.regenerateMessage(props.message.id);
}

// Copy message content
const copyMessage = () => {
    navigator.clipboard.writeText(props.message.content);
    vscode.postMessage({ 
        command: OutputCommands.SHOW_ALERT, 
        data: { message: 'Message copied' } 
    });
}

// Delete message from history
const deleteMessage = () => {
    chatStore.deleteMessage(props.message.id);
}
</script>