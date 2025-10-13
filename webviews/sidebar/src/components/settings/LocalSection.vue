<template>
    <section class="flex flex-col space-y-2">
        <div v-for="model in localModels" :key="model.id"
            class="py-2 flex items-center space-x-2 shadow rounded border border-gray px-2 py-1">
            <div class="flex-1 flex flex-col space-y-1 text-xs">
                <div class="font-bold flex justify-between items-center">
                    <span>{{ model.name }}</span>
                    <p class="font-medium text-red-500" v-if="model.status === 'not-downloaded'">
                        Not available
                    </p>
                    <p class="font-medium text-green-500" v-else-if="model.status === 'downloaded'">
                        Available
                    </p>
                    <p class="font-medium text-amber-500" v-else-if="model.status === 'downloading'">
                        Downloading...
                    </p>
                </div>
                <p class="text-muted mb-2">{{ model.description }}</p>
                <button v-if="model.status === 'not-downloaded' && model.downloadUrl"
                    class="text-xs flex items-center space-x-1 cursor-pointer select-none text-blue-500 font-semibold"
                    @click="downloadModel(model)">
                    <p>Download now ({{ formatBytes(model.fileSize) }})</p>
                </button>
                <button v-if="model.status === 'downloaded'"
                    class="text-xs flex items-center space-x-1 cursor-pointer select-none text-red-500 font-semibold"
                    @click="deleteModel(model)">
                    <p>Delete model</p>
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { OutputCommands } from '@/constants/commands';
import { useAppConfigStore } from '@/stores/appConfig';
import { vscode } from '@/utilities/vscode';
import { formatBytes } from '@/utilities/fortmatBytes';
import { useConfirmation } from '@/composables/useConfirmation';

const { confirm } = useConfirmation();
const appConfig = useAppConfigStore();
const localModels = computed(() => appConfig.llmModels);

/**
 * Download a model from the downloadUrl specified in the model.
 * @param {ModelConfig} model - The model to download
 */
const downloadModel = (model) => {
    const cloned = JSON.parse(JSON.stringify(model));
    vscode.postMessage({
        command: OutputCommands.DOWNLOAD_MODEL, data: {
            model: cloned
        }
    });
}

/**
 * Delete a local model from the disk.
 * @param {ModelConfig} model - The model to delete
 */
const deleteModel = async (model) => {
    // Prompt for delete confirmation
    const isConfirmed = await confirm({
        title: 'Delete confirmation',
        message: 'Are you sure you want to delete this model? This action cannot be undone.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
    });

    // Delete model file if confirmed
    if (isConfirmed) {
        const cloned = JSON.parse(JSON.stringify(model));
        vscode.postMessage({
            command: OutputCommands.DELETE_LOCAL_MODEL, data: {
                model: cloned
            }
        });
    } else {
        return;
    }
}
</script>