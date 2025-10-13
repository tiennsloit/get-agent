<template>
    <Popper ref="target" arrow :show="isOpen">
        <button
            class="max-w-40 flex items-center text-xs rounded border border-transparent px-2 h-6 cursor-pointer select-none space-x-1 hover:bg-zinc-500/20 truncate"
            v-bind:class="{ 'bg-zinc-500/20 border-gray': isOpen }" @click="isOpen = !isOpen">
            <span class="text-xs overflow-hidden whitespace-nowrap text-ellipsis">{{ label }}</span>
            <component v-if="icon" :is="icon" class="w-4 h-4" />
        </button>

        <template #content>
            <div class="popper-content border border-gray rounded overflow-hidden mx-2">
                <slot></slot>
            </div>
        </template>
    </Popper>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue';
import Popper from 'vue3-popper';
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef } from 'vue'

// Define props
defineProps<{
    icon?: Component,
    label: string,
    actions?: Record<string, any>,
}>()

// Define refs
const isOpen = ref(false);
const target = useTemplateRef<HTMLElement>('target')

// Manual close popper
const close = () => {
    isOpen.value = false;
}

// Close popper when clicked outside
onClickOutside(target, _ => close())

// Define expose
defineExpose({ close })
</script>

<style scoped>
.popper-content {
    background-color: var(--vscode-editor-background);
}
</style>