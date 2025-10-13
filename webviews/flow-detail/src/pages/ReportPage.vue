<template>
    <div class="max-w-240 rounded-lg border border-white/30 bg-white/5 mx-auto flex-1 w-full px-6 py-4 overflow-y-auto">
        <VueMarkdown :markdown="report" :custom-attrs="customAttrs" :rehype-plugins="[rehypeRaw]">
            <template #code="{ inline, content, ...props }">
                <code v-if="inline" style="color: rgb(230, 153, 191) !important">{{ content }}</code>
                <CodeBlock v-else :code="content" :classes="props.class" />
            </template>
        </VueMarkdown>
    </div>
</template>

<script setup lang="ts">
import CodeBlock from "@/components/CodeBlock.vue";
import { CustomAttrs, VueMarkdown } from "@crazydos/vue-markdown";
import rehypeRaw from 'rehype-raw';
import designDocument from './sample-report.txt?raw';
import { onMounted, ref } from "vue";
import { mockStream } from "@/utilities/mockStream";

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
const report = ref('');
onMounted(() => {
    mockStream(report, designDocument);
})
</script>