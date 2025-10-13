<template>
    <div class="text-white/50 text-xs flex space-x-2 items-center">
        <DoubleArrowIcon />
        <span>
            <slot />
        </span>
    </div>
</template>

<script setup>
import DoubleArrowIcon from '@/components/icons/DoubleArrowIcon.vue';
</script>