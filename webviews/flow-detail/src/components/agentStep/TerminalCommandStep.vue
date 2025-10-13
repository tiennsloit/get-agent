<template>
    <div class="p-2 rounded font-mono border border-white/30 text-xs overflow-x-auto flex flex-col space-y-2">
        <div class="flex space-x-1 items-center text-white/50">
            <TerminalIcon />
            <span>terminal</span>
        </div>
        <hr class="text-white/30 -mx-2">
        <div class="flex items-center gap-2 mt-2 mb-4">
            <span class="text-gray-400">$</span>
            <span class="whitespace-nowrap">{{ step.command }}</span>
        </div>
        <hr class="text-white/30 -mx-2">
        <div v-if="step.output" class="text-gray-300">
            <button @click="toggleOutput"
                class="text-xs text-white/70 hover:text-white font-semibold cursor-pointer flex space-x-2">
                <span>{{ showOutput ? 'Hide' : 'Show' }} Output</span>
                <div :class="[showOutput ? 'rotate-270' : 'rotate-90', 'transition-transform']">></div>
            </button>
            <ExpandTransition>
                <div v-if="showOutput" class="mt-1 border border-white/20 bg-white/5 rounded-lg p-2">
                    {{ step.output }}
                </div>
            </ExpandTransition>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import TerminalIcon from '@/components/icons/TerminalIcon.vue';
import ExpandTransition from '@/components/ExpandTransition.vue';

defineProps({
    step: {
        type: Object,
        required: true
    }
});

const showOutput = ref(false);

const toggleOutput = () => {
    showOutput.value = !showOutput.value;
};
</script>