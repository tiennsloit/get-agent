<template>
    <div :class="[
        'max-w-16 flex-1 h-0.5 mx-4',
        state === 'done' ? 'bg-green-600' : 'bg-gray-300'
    ]"></div>
</template>

<script setup lang="ts">
interface Props {
    state: 'waiting' | 'active' | 'done';
}

defineProps<Props>();
</script>