<template>
    <div class="w-16 h-16 mb-3 text-6xl select-none">✨</div>
    <p class="text-3xl font-medium">Hi there!</p>
    <p class="text-muted">🚀 Your AI-Powered Coding Assistant!</p>
    <p class="text-muted mt-3">
        Struggling with a tricky bug? Need help optimizing your code?
        Or just looking for a quick way to generate
        efficient, well-structured code snippets? You're in the right place!
    </p>
    <p class="text-muted font-semibold mt-3">
        Need inspiration? Try asking:
    </p>
    <ul class="text-muted flex flex-col space-y-1">
        <li v-for="prompt in examplePrompts" class="italic cursor-pointer" @click="submitPrompt(prompt)">
            💡 {{ prompt }}
        </li>
    </ul>
    <p class="text-muted font-semibold mt-3">
        Quick commands:
    </p>
    <ul class="text-muted flex flex-col space-y-1">
        <li v-for="command in quickCommands" class="italic cursor-pointer"
            @click="submit(command.label, command.value)">
            <span class="rounded bg-zinc-900/30 px-1 font-medium">{{ command.value }}</span> {{ command.label }}
        </li>
    </ul>
    
    <!-- Recent Conversations Section -->
    <template v-if="recentConversations.length > 0">
        <p class="text-muted font-semibold mt-6">
            Recent:
        </p>
        <ul class="text-muted flex flex-col space-y-2 mt-2">
            <li v-for="conversation in recentConversations" 
                :key="conversation.id" 
                class="italic cursor-pointer hover:text-foreground transition-colors duration-200 p-2 rounded hover:bg-zinc-900/20"
                @click="loadConversation(conversation.id)">
                <div class="font-medium text-sm truncate">{{ conversation.title }}</div>
                <div class="text-xs opacity-70 truncate mt-1">{{ truncateContent(conversation.subtitle) }}</div>
                <div class="text-xs opacity-50 mt-1">{{ formatTime(conversation.time) }}</div>
            </li>
        </ul>
    </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAppStore } from '@/stores/app';
import type { ConversationPreview } from '@/types/chat';

interface Props {
    isAdvanced?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isAdvanced: false
});

const appStore = useAppStore();
const chatStore = useChatStore();

// Get recent conversations
const recentConversations = computed(() => {
    return chatStore.recentConversations;
});

// List of example prompts
const examplePrompts = [
    "How do I implement a REST API in Node.js?",
    "Write a C++ program to check if a number is prime",
    "Create a simple HTML form with fields for name, email, and a submit button."
];

// List of quick commands
const quickCommands = [
    { label: 'Generate unit test', value: '/test' },
    { label: 'Generate docstring', value: '/docstring' },
    { label: 'Review code', value: '/review' },
    { label: 'Explain code', value: '/explain' },
    { label: 'Optimize code', value: '/optimize' }
];

// Submit prompt function
const submitPrompt = (prompt: string) => {
    chatStore.submitPrompt(prompt);
};

// Submit prompt function
const submit = (prompt: string, value?: string) => {
    chatStore.submitPrompt((value ? value + ' ' : '') + prompt);
};

// Load conversation function
const loadConversation = (conversationId: string) => {
    chatStore.switchConversation(conversationId);
};

// Utility function to truncate content
const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
};

// Utility function to format time
const formatTime = (date: Date) => {
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
