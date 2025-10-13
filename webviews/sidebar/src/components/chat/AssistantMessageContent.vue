<template>
    <div class="w-full overflow-hidden text-wrap p-3 rounded-xl rounded-br-sm break-words markdown-viewer">
        <button v-if="messageContent.reasoning"
            class="mb-2 px-2 py-1 flex items-center space-x-1 text-xs rounded border border-gray bg-zinc-500/30 cursor-pointer"
            @click="isShowThinking = !isShowThinking">
            <span v-if="isThought">Thought</span>
            <template v-else>
                <span>Thinking</span>
                <ThreeDotLoader />
            </template>

            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 transition-transform duration-200"
                :class="{ 'rotate-180': isShowThinking }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <ExpandTransition :duration="300">
            <div v-if="messageContent.reasoning && isShowThinking"
                class="border border-gray bg-zinc-500/30 rounded-lg mb-4">
                <VueMarkdown :markdown="messageContent.reasoning" class="p-2 text-xs">
                    <template #code="{ inline, content, ...props }">
                        <code v-if="inline" style="color: rgb(230, 153, 191) !important">{{ content }}</code>
                        <CodeBlock v-else :code="content" :classes="props.class" />
                    </template>
                    <template #think="{ content, ...props }">
                        <div class="border border-gray bg-red-300">{{ content }}</div>
                    </template>
                </VueMarkdown>

                <button @click="isShowThinking = false"
                    class="w-full border-t border-gray px-2 py-1 text-xs select-none flex justify-center cursor-pointer hover:bg-zinc-500/20">
                    Collapse
                </button>
            </div>
        </ExpandTransition>

        <VueMarkdown :markdown="messageContent.content" class="text-sm">
            <template #code="{ inline, content, ...props }">
                <code v-if="inline" style="color: rgb(230, 153, 191) !important">{{ content }}</code>
                <CodeBlock v-else :code="content" :classes="props.class" />
            </template>
            <template #think="{ content, ...props }">
                <div class="border border-gray bg-red-300">{{ content }}</div>
            </template>
        </VueMarkdown>
    </div>
</template>

<script setup lang="ts">
import { VueMarkdown } from '@crazydos/vue-markdown';
import CodeBlock from '../CodeBlock.vue';
import { computed, ref } from 'vue';
import ExpandTransition from '../ExpandTransition.vue';
import ThreeDotLoader from '../ThreeDotLoader.vue';

const isShowThinking = ref(false);
const props = defineProps({
    content: {
        type: String,
        required: true
    }
})

// Computed
const messageContent = computed<{ content: string, reasoning: string }>(() => {
    let reasoning = '';
    let content = props.content;


    // Extract all reasoning from <think> tags (including incomplete ones)
    const thinkPattern = /<think>([\s\S]*?)(?=<\/think>|$)/g;
    const matches: string[] = [];
    let match;

    // Collect all matches
    while ((match = thinkPattern.exec(props.content)) !== null) {
        matches.push(match[1]);
    }

    // Join all reasoning with newlines
    reasoning = matches.join('\n').trim();

    // Remove all think tags (complete and incomplete) from content
    content = content.replace(/<think>[\s\S]*?(?=<\/think>|$)/g, '')
        .replace(/<\/think>/g, '')
        .trim();

    return {
        content,
        reasoning
    };
});

const isThought = computed<boolean>(() => {
    const content = props.content;

    // Count opening and closing tags
    const openTags = (content.match(/<think>/g) || []).length;
    const closeTags = (content.match(/<\/think>/g) || []).length;

    return openTags === closeTags;
});
</script>