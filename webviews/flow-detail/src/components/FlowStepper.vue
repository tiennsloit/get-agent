<template>
    <div class="flex-none flex items-center justify-center w-full py-4 px-6">
        <!-- Design Step -->
        <FlowStepperNode 
            :step-number="1" 
            label="Design" 
            :state="getStepState(1)"
            @step-click="handleStepClick" />

        <!-- Connector -->
        <FlowStepperConnector :state="getConnectorState(1)" />

        <!-- Execute Step -->
        <FlowStepperNode 
            :step-number="2" 
            label="Execute" 
            :state="getStepState(2)"
            @step-click="handleStepClick" />

        <!-- Connector -->
        <FlowStepperConnector :state="getConnectorState(2)" />

        <!-- Report Step -->
        <FlowStepperNode 
            :step-number="3" 
            label="Report" 
            :state="getStepState(3)"
            @step-click="handleStepClick" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FlowStepperNode from './FlowStepperNode.vue';
import FlowStepperConnector from './FlowStepperConnector.vue';

interface Props {
    currentStep: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['stepChange']);

const getStepState = (step: number): 'waiting' | 'active' | 'done' => {
    if (step < props.currentStep) return 'done';
    if (step === props.currentStep) return 'active';
    return 'waiting';
};

const getConnectorState = (position: number): 'waiting' | 'active' | 'done' => {
    // Connectors are "done" if the next step is active or done
    if (props.currentStep > position) return 'done';
    if (props.currentStep === position) return 'active';
    return 'waiting';
};

const handleStepClick = (step: number) => {
    // Allow navigation to any step that is active or completed
    // This allows users to switch between steps without stopping tasks
    if (step <= props.currentStep) {
        emit('stepChange', step);
    }
};
</script>