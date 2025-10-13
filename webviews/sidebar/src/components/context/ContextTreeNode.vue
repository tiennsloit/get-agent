<template>
    <div class="node">
        <div class="flex items-center py-1 px-2 rounded hover:bg-gray-500/10 cursor-pointer">
            <input type="checkbox" :checked="isSelected" @change="handleSelect" @click.stop
                class="rounded-xl text-blue-600 mr-2" />

            <div class="flex items-center flex-1 min-w-0">
                <FileIcon v-if="node.type === 'file'" class="mr-2 flex-shrink-0" />
                <FolderIcon v-else class="mr-2 flex-shrink-0" />
                <span class="truncate flex-1">{{ node.name }}</span>

                <button v-if="hasChildren" @click.stop="toggleExpand"
                    class="w-6 h-6 flex items-center justify-center ml-2 text-gray-500">
                    <ChevronDownIcon :class="{ 'rotate-180': isExpanded }" class="transition-transform duration-200" />
                </button>
                <div v-else class="w-6 h-6 ml-2"></div>
            </div>
        </div>

        <div v-if="isExpanded && hasChildren" class="ml-4 border-l border-gray-100/10 pl-1">
            <ContextTreeNode v-for="child in node.children" :key="child.path" :node="child" :selected-nodes="selectedNodes"
                :expanded-nodes="expandedNodes" @toggle="emit('toggle', $event)" @select="emit('select', $event)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CodeStructure } from '@/types/context';
import { computed } from 'vue'
import ChevronDownIcon from '../icons/ChevronDownIcon.vue';
import FileIcon from '../icons/FileIcon.vue';
import FolderIcon from '../icons/FolderIcon.vue';

const props = defineProps<{
    node: CodeStructure
    selectedNodes: Set<string>
    expandedNodes: Set<string>
}>()

const emit = defineEmits<{
    (e: 'toggle', path: string): void
    (e: 'select', node: CodeStructure): void
}>()

const hasChildren = computed(() =>
    props.node.children && props.node.children.length > 0
)

const isExpanded = computed(() =>
    props.expandedNodes.has(props.node.path)
)

const isSelected = computed(() =>
    props.selectedNodes.has(props.node.path)
)

const toggleExpand = () => {
    emit('toggle', props.node.path)
}

const handleSelect = () => {
    emit('select', props.node)
}
</script>