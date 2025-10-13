<template>
    <div class="w-full treeview rounded-lg">
        <ContextTreeNode v-for="child in rootChildren" :key="child.path" :node="child" :selected-nodes="selectedNodes"
            :expanded-nodes="expandedNodes" @toggle="toggleNode" @select="toggleSelection" />
    </div>
</template>

<script setup lang="ts">
import type { CodeStructure } from '@/types/context';
import { ref, watch, computed } from 'vue'
import ContextTreeNode from './ContextTreeNode.vue';

const props = defineProps<{
    codebase: CodeStructure | null
}>()

const emit = defineEmits<{
    (e: 'selection-change', selected: CodeStructure[]): void
}>()

const selectedNodes = ref<Set<string>>(new Set())
const expandedNodes = ref<Set<string>>(new Set())

const rootChildren = computed(() => {
    return props.codebase?.children || []
})

const toggleNode = (path: string) => {
    const expanded = expandedNodes.value
    if (expanded.has(path)) {
        expanded.delete(path)
    } else {
        expanded.add(path)
    }
    expandedNodes.value = new Set(expanded)
}

const toggleSelection = (node: CodeStructure) => {
    const selected = selectedNodes.value
    if (selected.has(node.path)) {
        selected.delete(node.path)
    } else {
        selected.add(node.path)
    }
    selectedNodes.value = new Set(selected)

    const selectedItems = getAllNodes().filter(n =>
        selectedNodes.value.has(n.path)
    )
    emit('selection-change', selectedItems)
}

const getAllNodes = (): CodeStructure[] => {
    const result: CodeStructure[] = []
    const traverse = (node: CodeStructure) => {
        result.push(node)
        if (node.children) {
            node.children.forEach(traverse)
        }
    }

    if (props.codebase) {
        traverse(props.codebase)
    }
    return result
}

// Watch for codebase changes - keep all folders collapsed by default
watch(() => props.codebase, (newCodebase) => {
    if (newCodebase) {
        // Reset expanded nodes when codebase changes
        expandedNodes.value = new Set()
    }
}, { immediate: true })
</script>
