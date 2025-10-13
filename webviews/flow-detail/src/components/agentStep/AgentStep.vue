<template>
    <!-- Thought -->
    <ThoughtStep v-if="step.type === 'thought'">{{ step.content }}</ThoughtStep>

    <!-- Log -->
    <LogStep v-else-if="step.type === 'log'">{{ step.content }}</LogStep>

    <!-- File Change -->
    <FileChangeStep v-else-if="step.type === 'file-change'" :step="step" />

    <!-- Terminal Command -->
    <TerminalCommandStep v-else-if="step.type === 'terminal-command'" :step="step" />
</template>

<script setup>
import ThoughtStep from './ThoughtStep.vue';
import LogStep from './LogStep.vue';
import FileChangeStep from './FileChangeStep.vue';
import TerminalCommandStep from './TerminalCommandStep.vue';

defineProps({
    step: {
        type: Object,
        required: true
    }
});
</script>
