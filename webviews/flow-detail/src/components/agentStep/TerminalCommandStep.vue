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
        <div v-if="step.output" class="text-gray-300 flex flex-col items-end">
            <button @click="toggleOutput"
                class="text-xs text-white/70 hover:text-white font-medium cursor-pointer flex space-x-1">
                <span>{{ showOutput ? 'Hide' : 'Show' }} output</span>
                <svg :class="[showOutput ? 'rotate-180' : '', 'transition-transform w-4 h-4']" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
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