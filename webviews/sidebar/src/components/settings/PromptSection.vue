<template>
    <section class="pw-full">
        <!-- Select Preset -->
        <div class="flex flex-col space-y-2">
            <p class="text-muted text-sm font-semibold">Built-in presets</p>
            <div class="border border-gray rounded text-xs">
                <div v-for="(preset, index) in presets" :key="preset.name"
                    class="p-2 hover:bg-zinc-500/20 border-gray font-medium group select-none"
                    :class="{ 'border-b': index !== presets.length - 1 }">
                    <div class="flex items-center justify-between">
                        <span>{{ preset.name }}</span>
                        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button v-if="!expandedPreset"
                                class="h-6 px-2 rounded hover:bg-zinc-500/20 flex items-center justify-center cursor-pointer space-x-1"
                                @click="editPreset(preset)">
                                <EditIcon />
                                <span class="text-xs font-light">Edit</span>
                            </button>
                        </div>
                    </div>
                    <ExpandTransition :duration="300">
                        <div v-if="expandedPreset?.name === preset.name" class="mt-2 flex flex-col space-y-2">
                            <p class="text-muted text-xs font-medium">System prompt</p>
                            <textarea v-model="expandedPreset.system_prompt"
                                class="w-full min-h-48 p-2 text-xs border border-gray rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-light"
                                rows="4" placeholder="Enter system prompt..." />

                            <p class="text-muted text-xs font-medium">Rules</p>
                            <textarea v-model="expandedPreset.assistant_prompt"
                                class="w-full min-h-48 p-2 text-xs border border-gray rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-light"
                                rows="4" placeholder="Enter rules..." />

                            <div class="w-full flex justify-end space-x-2">
                                <div class="rounded bg-zinc-500 hover:bg-zinc-600 px-2 py-1 cursor-pointer select-none text-xs font-semibold"
                                    @click="expandedPreset = null">
                                    Cancel
                                </div>

                                <div class="rounded bg-blue-500 hover:bg-blue-600 px-2 py-1 cursor-pointer select-none text-xs font-semibold"
                                    @click="savePreset(expandedPreset.name)">
                                    Save
                                </div>
                            </div>
                        </div>
                    </ExpandTransition>
                </div>
            </div>

            <p class="mt-2 text-muted text-sm font-semibold">Custom presets</p>
            <div v-if="!expandedPreset" class="border border-gray rounded text-xs font-medium">
                <div class="p-2 hover:bg-zinc-500/20 cursor-pointer flex items-center space-x-1">
                    <AddIcon class="h-6" />
                    <span>Add preset</span>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import AddIcon from '../icons/AddIcon.vue';
import ExpandTransition from '../ExpandTransition.vue';
import EditIcon from '../icons/EditIcon.vue';
import { useSettingStore } from '@/stores/setting';
import type { PromptPreset } from '@/types/promptPreset';
import { vscode } from '@/utilities/vscode';
import { OutputCommands } from '@/constants/commands';
import { useCloned } from '@vueuse/core';

const settingStore = useSettingStore();
const { presets } = storeToRefs(settingStore);
const expandedPreset = ref<PromptPreset | null>(null);

/**
 * Opens the expanded preset editor to edit an existing preset.
 * @param preset The preset object to edit.
 */
const editPreset = (preset: PromptPreset) => {
    const { cloned } = useCloned(preset);
    expandedPreset.value = cloned.value;
}

/**
 * Validates and saves a prompt preset.
 * @param presetName The name of the preset.
 */
const savePreset = (presetName: string) => {
    // Validate the system prompt and assistant prompt
    if (!expandedPreset.value?.system_prompt || !expandedPreset.value?.assistant_prompt) {
        // TODO: Replace with in-app alert
        vscode.postMessage({
            command: OutputCommands.SHOW_ALERT,
            data: { message: 'System prompt and Rules are required' }
        })
        return;
    }

    // Update the preset
    settingStore.updatePreset(presetName, expandedPreset.value!);

    // Collapse the expanded preset
    expandedPreset.value = null;
};
</script>
