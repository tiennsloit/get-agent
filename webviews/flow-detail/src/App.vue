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
import FlowStepper from './components/FlowStepper.vue';
import DesignPage from './pages/DesignPage.vue';
import ExecutePage from './pages/ExecutePage.vue';
import ReportPage from './pages/ReportPage.vue';
import TestMermaid from './components/TestMermaid.vue';

const flowStore = useFlowStore();

const handleStepChange = (step: number) => {
  flowStore.setCurrentStep(step);
};

onMounted(() => {
  flowStore.initialize();
});

onUnmounted(() => {
  flowStore.cleanup();
});
</script>