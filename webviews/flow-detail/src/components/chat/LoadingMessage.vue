<template>
  <div class="flex items-start space-x-2 text-xs">
    <div class="flex-1 bg-white/5 border border-white/10 rounded-lg p-3">
      <div class="flex items-center space-x-2">
        <ThreeDotLoader />
        <span class="text-gray-400">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThreeDotLoader from './ThreeDotLoader.vue';
import { computed } from 'vue';
import { useDesignStore } from '@/stores/designStore';

const designStore = useDesignStore();

const loadingText = computed(() => {
  if (designStore.explorerContext.isExploring) {
    const iteration = designStore.explorerContext.currentIteration;
    return iteration > 0 
      ? `Exploring... (Iteration ${iteration})`
      : 'Analyzing request...';
  }
  return 'Thinking...';
});
</script>
