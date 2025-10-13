<template>
  <div class="flex space-x-1">
    <!-- SELECT MODEL BUTTON -->
    <PopupButton ref="modelBtn" :label="modelName" :icon="UpIcon">
      <div class="flex flex-col space-y-1 text-xs p-2 max-h-96 overflow-auto">
        <!-- LOCAL PROVIDER -->
        <div class="uppercase font-semibold">Local</div>
        <template v-for="modelItem in llmModels" :key="modelItem.id">
          <div class="py-1 px-2 rounded flex justify-between items-center space-x-2 cursor-pointer"
            v-bind:class="{ 'bg-zinc-500/20': 'local:' + modelItem.id === model, 'text-zinc-500': modelItem.status !== 'downloaded', 'hover:bg-zinc-500/20': modelItem.status === 'downloaded' }"
            @click="selectModel('local', modelItem.id, modelItem.status === 'downloaded')">
            <span>{{ modelItem.name ?? modelItem.id }}</span>
            <CheckIcon v-if="'local:' + modelItem.id === model" />
          </div>
        </template>

        <!-- REMOTE PROVIDERS -->
        <template v-for="provider in providers" :key="provider.id" class="text-xs select-none">
          <div class="uppercase font-semibold">{{ provider.name }}</div>
          <template v-for="modelItem in provider.models" :key="modelItem.id">
            <div v-if="modelItem.enabled"
              class="py-1 px-2 rounded hover:bg-zinc-500/20 cursor-pointer flex justify-between items-center space-x-2"
              v-bind:class="{ 'bg-zinc-500/20': provider.id + ':' + modelItem.id === model }"
              @click="selectModel(provider.id, modelItem.id)">
              <span>{{ modelItem.name ?? modelItem.id }}</span>
              <CheckIcon v-if="provider.id + ':' + modelItem.id === model" />
            </div>
          </template>
        </template>
      </div>
    </PopupButton>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { useAppStore } from '@/stores/app'
import { useAppConfigStore } from '@/stores/appConfig'
import PopupButton from '../PopupButton.vue'
import CheckIcon from '../icons/CheckIcon.vue'
import UpIcon from '../icons/UpIcon.vue'
import AddIcon from '../icons/AddIcon.vue'
import { useSetting } from '@/composables/useSetting';
import { SETTING_SECTIONS } from '@/constants/setting';
import { useSettingStore } from '@/stores/setting';
import { ChatMode } from '@/types/appState';

const appStore = useAppStore()
const appConfig = useAppConfigStore()
const settingStore = useSettingStore();
const chatStore = useChatStore()
const { open } = useSetting();
const { presets } = storeToRefs(settingStore);
const { chatMode } = storeToRefs(appStore);
const { providers, llmModels } = storeToRefs(appConfig)
const modelBtn = ref();

// Get selected preset reactively
const selectedPreset = computed(() => {
  return chatStore.selectedPreset;
});

// Computed properties - now use the current store's selected model
const model = computed(() => {
  return chatStore.selectedModel || 'default';
});

const modelName = computed(() => {
  if (model.value && model.value !== 'default') {
    const [_, modelId] = model.value.split(':');
    return modelId;
  } else {
    return 'Not selected';
  }
});

/**
 * Select a model for the current chat mode.
 * Updates the selected model in the current store (normal or advanced).
 * Close the model popup button.
 * @param {string} providerId - The model provider ID.
 * @param {string} modelId - The model ID.
 * @param {boolean} enabled - Whether the model is enabled. Default is true.
 */
const selectModel = (providerId: string, modelId: string, enabled: boolean = true) => {
  if (enabled) {
    const selectedModel = providerId + ':' + modelId;
    chatStore.setSelectedModel(selectedModel);
  } else {
    // Open local model settings
    open(SETTING_SECTIONS.LOCAL);
  }

  modelBtn.value?.close();
}

/**
 * Open the prompt presets settings page.
 */
const addPreset = () => {
  open(SETTING_SECTIONS.PROMPTS);
}
</script>
