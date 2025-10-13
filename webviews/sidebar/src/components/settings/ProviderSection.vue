<template>
    <section v-if="providers?.length">
        <div class="flex flex-col space-y-4">
            <div v-for="provider in allProviders" :key="provider.id" v-bind:data-provider-id="provider.id"
                class="border border-gray rounded-lg p-4 shadow-sm select-none flex flex-col space-y-2"
                v-bind:class="{ 'border-white': expandedProvider === provider }">
                <div class="flex justify-between items-center space-x-2">
                    <template v-if="expandedProvider?.id === provider.id">
                        <input v-model="expandedProvider.name" @click.stop="$event.stopPropagation()"
                            class="flex-1 bg-transparent border border-gray px-2 py-1 rounded focus:border-blue-400" />
                    </template>
                    <template v-else>
                        <h3 class="font-semibold text-sm">
                            {{ provider.name }}
                            <span class="text-xs text-gray-400">
                                ({{ provider.models.length }})
                            </span>
                        </h3>
                        <button @click.stop="toggleProvider(provider)"
                            class="text-xs flex items-center space-x-1 text-green-500 cursor-pointer hover:text-green-600">
                            <EditIcon />
                            <span>Edit</span>
                        </button>
                    </template>
                </div>

                <!-- Expanded Config Panel -->
                <ExpandTransition :duration="300">
                    <div v-if="expandedProvider && expandedProvider.id === provider.id && provider.configuration && provider.id !== 'local'"
                        class="mt-4 space-y-3">
                        <div>
                            <label class="block text-sm font-medium">API URL</label>
                            <input v-model="expandedProvider!.configuration!.apiUrl"
                                class="w-full mt-1 border border-gray px-2 py-1 rounded" placeholder="https://..." />
                        </div>
                        <div>
                            <label class="block text-sm font-medium">API Key</label>
                            <input v-model="expandedProvider!.configuration!.apiKey"
                                class="w-full mt-1 border border-gray px-2 py-1 rounded" placeholder="API key..."
                                type="password" />
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-medium text-sm">Models</h4>
                                <button v-if="hasModels" @click.stop="fetchModels(expandedProvider)"
                                    class="text-xs flex items-center space-x-1 cursor-pointer"
                                    v-bind:class="isFetchingModels ? 'text-gray-500' : 'text-blue-500 hover:text-blue-600'">
                                    <template v-if="isFetchingModels">
                                        <ReloadIcon class="animate-spin" />
                                        <span>Fetching...</span>
                                    </template>
                                    <template v-else>
                                        <ReloadIcon />
                                        <span>Fetch</span>
                                    </template>
                                </button>
                            </div>
                            <div v-for="model in expandedProvider.models" :key="model.id"
                                class="flex justify-between text-xs mb-2 border-b border-dotted border-gray pb-1">
                                <span>{{ model.id }}</span>
                                <input type="checkbox" v-model="model.enabled" />
                            </div>
                        </div>

                        <div v-if="!hasModels"
                            class="flex border-2 border-dashed border-gray rounded-lg flex-col items-center justify-center space-y-2 p-4">
                            <span>No models available!</span>
                            <button
                                class="px-2 py-1 rounded-full border text-sm cursor-pointer flex space-x-2 items-center"
                                v-bind:class="isFetchingModels ? 'text-gray-500' : 'text-blue-500 hover:text-blue-600'"
                                @click.stop="fetchModels(expandedProvider)">
                                <template v-if="isFetchingModels">
                                    <ReloadIcon class="animate-spin" />
                                    <span>Fetching...</span>
                                </template>
                                <template v-else>
                                    <ReloadIcon />
                                    <span>Fetch</span>
                                </template>
                            </button>
                        </div>

                        <div class="flex justify-between items-center space-x-2">
                            <button @click.stop="deleteProvider(expandedProvider)"
                                class="flex items-center space-x-1 text-red-500 cursor-pointer hover:text-red-600">
                                <TrashIcon />
                                <span>Delete</span>
                            </button>

                            <div class="flex space-x-2 items-center">
                                <button v-if="!newProvider && hasModels" @click="toggleProvider(provider)"
                                    class="cursor-pointer text-white hover:text-gray-400 px-3 py-1 rounded">
                                    Cancel
                                </button>
                                <button v-if="hasModels" @click="saveProvider(expandedProvider)"
                                    class="cursor-pointer bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                                    Save
                                </button>
                                <p v-else class="text-muted text-sm text-amber-600">
                                    ⚠︎ Model not selected
                                </p>
                            </div>
                        </div>
                    </div>
                </ExpandTransition>
            </div>

            <!-- Add Provider Card -->
            <div class="border-dashed border font-semibold border-gray-300 rounded-lg p-4 flex items-center justify-center text-gray-500 cursor-pointer hover:border-white"
                @click="addProvider">
                + Add Provider
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { useCloned, useEventBus } from '@vueuse/core';
import { computed, onUnmounted, ref } from 'vue';
import { useConfirmation } from '@/composables/useConfirmation';
import { BusEvents } from '@/constants/busEvent';
import { OutputCommands } from '@/constants/commands';
import { useAppConfigStore } from '@/stores/appConfig';
import type { ModelConfig, ProviderConfig } from '@/types/appConfig';
import { vscode } from '@/utilities/vscode';
import ReloadIcon from '../icons/ReloadIcon.vue';
import EditIcon from '../icons/EditIcon.vue';
import TrashIcon from '../icons/TrashIcon.vue';
import ExpandTransition from '../ExpandTransition.vue';
import { useSetting } from '@/composables/useSetting';

const { close } = useSetting();
const { confirm } = useConfirmation();
const syncModelsBus = useEventBus<{ id: string, models: ModelConfig[] }>(BusEvents.SYNC_MODELS);
const appConfig = useAppConfigStore();
const { cloned: providersCloned } = useCloned<Array<ProviderConfig>>(appConfig.providers);
const providers = ref<ProviderConfig[]>(providersCloned.value);
const expandedProvider = ref<ProviderConfig | null>(null);
const newProvider = ref<ProviderConfig | null>(null);
const isFetchingModels = ref<boolean>(false);

// Computed
const hasModels = computed(() => {
    return expandedProvider.value?.models.length;
});
const allProviders = computed(() => {
    return [...providers.value, ...(newProvider.value ? [newProvider.value] : [])];
});

// Listen to event bus
const unsubscribe = syncModelsBus.on(({ id, models }) => {
    if (expandedProvider.value && expandedProvider.value.id === id) {
        isFetchingModels.value = false;
        expandedProvider.value.models = models.map((m) => {
            const existingModel = expandedProvider.value!.models.find((m2) => m2.id === m.id);
            if (existingModel) {
                return { ...m, enabled: existingModel.enabled };
            }
            return { ...m, enabled: true, name: m.name ?? m.id };
        });
    }
});

// On dispose
onUnmounted(() => {
    unsubscribe();
});

/**
 * Toggles the expanded state of a provider in the configuration UI.
 * 
 * If a provider is currently expanded and unsaved, prompts for confirmation 
 * before closing it. If confirmed or if no provider is expanded, opens the 
 * specified provider. If the provider is being added, marks it as new.
 * Scrolls the provider element into view once opened.
 *
 * @param {ProviderConfig} provider - The provider to toggle.
 * @param {boolean} isAdding - Flag indicating if the provider is being added.
 * 
 * @returns {Promise<void>}
 */

const toggleProvider = async (provider: ProviderConfig, isAdding: boolean = false) => {
    // Close opening provider
    if (expandedProvider.value) {
        // Close current provider
        if (expandedProvider.value.id === provider.id) {
            expandedProvider.value = null;
            return;
        }

        // Prompt for close editing provider
        const isConfirmed = await confirm({
            title: 'Provider not saved',
            message: 'Are you sure you want to close this provider without saving?',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
        });

        // Clear provider if confirmed
        if (isConfirmed) {
            expandedProvider.value = null;
            newProvider.value = null;
        } else {
            return;
        }
    }

    // Open provider
    const { cloned } = useCloned<ProviderConfig>(provider)
    expandedProvider.value = cloned.value;
    isFetchingModels.value = false;
    if (isAdding) {
        newProvider.value = provider;
    }

    // Scroll to provider
    const providerElement = document.querySelector(`[data-provider-id="${provider.id}"]`);
    if (providerElement) {
        setTimeout(() => {
            providerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

    }
}

/**
 * Saves the given provider to the providers list.
 *
 * @param {ProviderConfig} provider - The provider to save.
 *
 * @returns {void}
 */
const saveProvider = (provider) => {
    if (newProvider.value) {
        providers.value.push(provider);
    } else {
        providers.value = providers.value.map(p => p.id === provider.id ? provider : p);
    }
    expandedProvider.value = null;
    newProvider.value = null;
}

/**
 * Deletes the given provider.
 *
 * @param {ProviderConfig} provider - The provider to delete.
 *
 * @returns {Promise<void>} A promise that resolves when the provider is deleted.
 */
const deleteProvider = async (provider) => {
    const isConfirmed = await confirm({
        title: 'Delete Provider',
        message: 'Are you sure you want to delete this provider?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
    });

    if (isConfirmed) {
        providers.value = providers.value.filter(p => p.id !== provider.id)
        newProvider.value = null
        if (expandedProvider.value === provider) {
            expandedProvider.value = null
        }
    }
}

/**
 * Adds a new provider to the list of providers.
 *
 * @returns {void}
 */
const addProvider = () => {
    const provider: ProviderConfig = {
        id: Date.now().toString(),
        name: 'New Provider',
        configuration: { apiUrl: '', apiKey: '' },
        models: []
    }
    toggleProvider(provider, true);
}

/**
 * Requests the model list for a provider from the main thread.
 * If a model list request is already in progress, this function does nothing.
 * @param {ProviderConfig} provider - The provider to request the model list for.
 * @returns {void}
 */
const fetchModels = (provider) => {
    if (isFetchingModels.value) { return; }
    vscode.postMessage({
        command: OutputCommands.FETCH_MODELS,
        data: { id: provider.id, apiUrl: provider.configuration.apiUrl, apiKey: provider.configuration.apiKey }
    });
    isFetchingModels.value = true;
}
</script>