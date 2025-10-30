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
import { useFlowStore } from '../stores/flowStore';
import FlowStepperNode from './FlowStepperNode.vue';
import FlowStepperConnector from './FlowStepperConnector.vue';

interface Props {
    currentStep: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['stepChange']);
const flowStore = useFlowStore();

const getStepState = (step: number): 'waiting' | 'active' | 'done' => {
    const maxAvailable = flowStore.maxAvailableStep;
    
    // Steps beyond maxAvailable are waiting
    if (step > maxAvailable) return 'waiting';
    
    // Current step is active
    if (step === props.currentStep) return 'active';
    
    // Steps before current and within available range are done
    if (step < props.currentStep) return 'done';
    
    return 'waiting';
};

const getConnectorState = (position: number): 'waiting' | 'active' | 'done' => {
    const maxAvailable = flowStore.maxAvailableStep;
    
    // Connector after the max available step is waiting
    if (position >= maxAvailable) return 'waiting';
    
    // Connectors are "done" if the next step is active or done
    if (props.currentStep > position) return 'done';
    if (props.currentStep === position) return 'active';
    return 'waiting';
};

const handleStepClick = (step: number) => {
    // Only allow navigation to steps within the available range based on flow state
    const maxAvailable = flowStore.maxAvailableStep;
    
    if (step <= maxAvailable) {
        emit('stepChange', step);
    } else {
        console.log('[FlowStepper] Cannot navigate to step', step, '- not available yet (max:', maxAvailable, ')');
    }
};
</script>