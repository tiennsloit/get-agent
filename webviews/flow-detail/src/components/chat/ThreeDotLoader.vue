<template>
  <div class="flex justify-center items-center space-x-1">
    <div v-for="(dot, index) in dots" :key="index" class="w-1 h-1 rounded-full animate-bounce bg-loader"
      :style="`animation-delay: ${index * 0.1}s`"></div>
  </div>
</template>

<script setup>
const dots = [1, 2, 3];
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite ease-in-out;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.bg-loader {
  background-color: #8d8d8d;
}
</style>
