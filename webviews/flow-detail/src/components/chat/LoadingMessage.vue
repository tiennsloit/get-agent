<template>
  <div class="flex items-start space-x-2 text-xs">
    <div class="flex-1 bg-white/5 border border-white/10 rounded-lg p-3">
      <div class="flex items-center space-x-2">
        <ThreeDotLoader />
        <span class="text-gray-400">Thinking...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThreeDotLoader from './ThreeDotLoader.vue';
</script>
