<template>
    <div class="overflow-hidden">
        <ExpandTransition>
            <div v-if="trigger == '/'" class="w-full max-h-48 border-b border-gray overflow-auto">
                <div v-for="i in displayCommands" @click="handleCommandSelect(i.value)"
                    class="h-8 px-2 flex items-center justify-start text-xs border-b border-gray hover:bg-sky-950 cursor-pointer">
                    /{{ i.value }} - {{ i.name }}
                </div>
            </div>

            <div v-else-if="trigger == '@'" class="w-full max-h-48 border-b border-gray overflow-auto">
                <!-- Breadcrumbs navigation -->
                <div v-if="currentPath.length > 0"
                    class="flex items-center text-xs p-1 border-b border-gray bg-gray-900 text-gray-400">
                    <span class="cursor-pointer hover:text-gray-200" @click="navigateToRoot">root</span>
                    <span v-for="(path, index) in currentPath" :key="index" class="flex items-center">
                        <span class="mx-1">/</span>
                        <span class="cursor-pointer hover:text-gray-200" @click="navigateTo(index)">
                            {{ path }}
                        </span>
                    </span>
                </div>

                <!-- Directory contents -->
                <div v-if="filteredItems.length > 0">
                    <div v-for="item in filteredItems" :key="item.path"
                        class="h-8 px-2 flex items-center justify-between text-xs border-b border-gray hover:bg-sky-950 cursor-pointer"
                        @click="handleItemClick(item)">
                        <div class="flex-1 flex items-center">
                            <span v-if="item.type === 'directory'" class="mr-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path
                                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z">
                                    </path>
                                </svg>
                            </span>
                            <span v-if="item.type === 'file'" class="mr-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                            </span>
                            <div class="flex items-center">
                                <span>{{ item.name }}</span>
                                <span v-if="shouldShowFileDescription(item)" class="text-gray-400 ml-2">
                                    {{ getFileDescription(item) }}
                                </span>
                                <span v-if="item.type === 'directory' && shouldShowDirectoryDescription(item)"
                                    class="text-gray-400 ml-2">
                                    {{ getDirectoryDescription(item) }}
                                </span>
                            </div>
                        </div>
                        <div v-if="shouldShowArrow(item)" @click.stop="handleArrowClick(item)" class="ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
                <div v-else class="h-8 px-2 flex items-center justify-center text-xs text-gray-400">
                    No items found
                </div>
            </div>
        </ExpandTransition>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useContextStore } from '@/stores/context';
import type { CodeStructure } from '@/types/context';
import ExpandTransition from '../ExpandTransition.vue';

// Define emits and props
const emit = defineEmits(['onSelected'])
const props = defineProps<{
    text?: string
    trigger?: string
}>()

const contextStore = useContextStore();
const { codebase } = storeToRefs(contextStore);
const currentPath = ref<string[]>([]);

// Get the current directory items
const currentItems = computed(() => {
    if (props.trigger !== '@' || !codebase.value) return [];

    let items = codebase.value.children || [];

    for (const pathPart of currentPath.value) {
        const found = items.find(item =>
            item.name === pathPart && item.type === 'directory'
        );
        if (found) {
            items = found.children || [];
        } else {
            currentPath.value = [];
            return codebase.value.children || [];
        }
    }

    return items;
});

// Filter the items based on the search text
const filteredItems = computed(() => {
    if (!currentItems.value) return [];

    if (props.text) {
        return filterItemsRecursive(currentItems.value, props.text.toLowerCase());
    }

    return [...currentItems.value].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });
});

// Reset to root when the list becomes empty
watch(() => filteredItems.value, (newItems) => {
    if (newItems.length === 0) {
        currentPath.value = [];
    }
});

const commands = [
    { name: 'Generate unit test', value: 'test' },
    { name: 'Generate docstring', value: 'docstring' },
    { name: 'Review code', value: 'review' },
    { name: 'Explain code', value: 'explain' },
    { name: 'Optimize code', value: 'optimize' }
];

const handleCommandSelect = (value: string) => {
    currentPath.value = []; // Reset to root when command is selected
    emit('onSelected', value);
};

const displayCommands = computed(() => {
    if (props.trigger !== '/') return [];
    if (!props.text) return commands;
    return commands.filter(cmd =>
        cmd.value.toLowerCase().includes(props.text!.toLowerCase())
    );
});

const filterItemsRecursive = (items: CodeStructure[], searchText: string): CodeStructure[] => {
    return items
        .filter(item => item.name.toLowerCase().includes(searchText))
        .sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
};

const countAllFiles = (dir: CodeStructure): number => {
    if (!dir.children) return 0;

    let count = 0;
    for (const item of dir.children) {
        if (item.type === 'file') {
            count++;
        } else if (item.type === 'directory') {
            count += countAllFiles(item);
        }
    }
    return count;
};

const countDirectSubfolders = (dir: CodeStructure): number => {
    if (!dir.children) return 0;
    return dir.children.filter(item => item.type === 'directory').length;
};

const shouldShowFileDescription = (item: CodeStructure): boolean => {
    return item.type === 'file' && currentPath.value.length > 0;
};

const getFileDescription = (item: CodeStructure): string => {
    const pathParts = item.path.split('/');
    pathParts.pop(); // Remove filename
    return pathParts.join('/');
};

const shouldShowDirectoryDescription = (item: CodeStructure): boolean => {
    if (item.type !== 'directory') return false;
    const fileCount = countAllFiles(item);
    const folderCount = countDirectSubfolders(item);
    return fileCount > 0 || folderCount > 0;
};

const getDirectoryDescription = (item: CodeStructure): string => {
    const fileCount = countAllFiles(item);
    const folderCount = countDirectSubfolders(item);

    if (fileCount > 0 && folderCount > 0) {
        return `(${fileCount} files, ${folderCount} folders)`;
    } else if (fileCount > 0) {
        return `(${fileCount} files)`;
    } else {
        return `(${folderCount} folders)`;
    }
};

const shouldShowArrow = (item: CodeStructure): boolean => {
    return item.type === 'directory' && item.children?.length > 0;
};

const handleItemClick = (item: CodeStructure) => {
    if (item.type === 'file') {
        emit('onSelected', item.path);
    } else {
        if (item.children?.length) {
            currentPath.value.push(item.name);
        } else {
            emit('onSelected', item.path);
        }
    }
};

const handleArrowClick = (item: CodeStructure) => {
    emit('onSelected', item.path);
};

const navigateTo = (index: number) => {
    currentPath.value = currentPath.value.slice(0, index + 1);
};

const navigateToRoot = () => {
    currentPath.value = [];
};
</script>