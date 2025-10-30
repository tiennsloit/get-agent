<template>
  <div class="h-screen flex flex-col">
    <!-- Stepper Component -->
    <FlowStepper :current-step="flowStore.currentStep" @step-change="handleStepChange" />

    <!-- Main Content Area -->
    <div class="grow flex overflow-hidden">
      <DesignPage v-if="flowStore.currentStep === 1" />
      <ExecutePage v-if="flowStore.currentStep === 2" />
      <ReportPage v-if="flowStore.currentStep === 3" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useFlowStore } from './stores/flowStore';
import { useDesignStore } from './stores/designStore';
import { useExecuteStore } from './stores/executeStore';
import FlowStepper from './components/FlowStepper.vue';
import DesignPage from './pages/DesignPage.vue';
import ExecutePage from './pages/ExecutePage.vue';
import ReportPage from './pages/ReportPage.vue';
import TestMermaid from './components/TestMermaid.vue';

const flowStore = useFlowStore();
const designStore = useDesignStore();
const executeStore = useExecuteStore();

const handleStepChange = (step: number) => {
  flowStore.setCurrentStep(step);
};

// Initialize all stores once when the app mounts
onMounted(() => {
  console.log('[App] Initializing all stores');
  flowStore.initialize();
  designStore.initialize();
  executeStore.initialize();
});

// Clean up all stores when the app is completely unmounted
onUnmounted(() => {
  console.log('[App] Cleaning up all stores');
  flowStore.cleanup();
  designStore.cleanup();
  executeStore.cleanup();
});
</script>