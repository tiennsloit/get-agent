<template>
    <section v-if="features?.length">
        <div class="flex flex-col space-y-4">
            <div v-for="(feature, key) in features" :key="key" class="w-full border border-gray p-2 rounded-lg">
                <div class="w-full flex">
                    <div class="flex-1 text-sm capitalize font-semibold">
                        {{ feature.name }}
                    </div>
                    <Toggle :value="feature.enabled" :classes="{
                        container: 'inline-block rounded-full',
                        toggle: 'flex w-6 h-3 rounded-full relative cursor-pointer transition items-center box-content border-2 text-xs leading-none',
                        handle: 'inline-block bg-white w-3 h-3 top-0 rounded-full absolute transition-all',
                    }" @click="toggleEnableFeat(feature.id)" />
                </div>
                <p class="text-xs py-2">{{ feature.description }}</p>
                <hr class="border-gray my-1 -mx-2">
                <div class="flex space-x-2 justify-between items-center">
                    <div class="text-xs font-semibold">Model</div>
                    <select :value="feature.model" @change="selectModelFeat(feature.id, $event)" name="model-selector"
                        class="max-w-1/2 text-xs rounded py-1 px-2 text-right">
                        <option v-if="!feature.model" :value="undefined" disabled>Not selected</option>
                        <!-- LOCAL MODELS -->
                        <option disabled>LOCAL MODELS</option>
                        <template v-for="model in llmModels" :key="model.id">
                            <option :value="'local:' + model.id" :disabled="model.status !== 'downloaded'">
                                {{ model.name ?? model.id }}
                                <span v-if="model.status !== 'downloaded'">(Not downloaded)</span>
                            </option>
                        </template>

                        <!-- REMOTE PROVIDERS -->
                        <template v-for="provider in providers" :key="provider.id">
                            <option disabled>{{ provider.name.toUpperCase() }}</option>
                            <template v-for="model in provider.models" :key="model.id">
                                <option v-if="model.enabled" :value="provider.id + ':' + model.id">
                                    {{ model.name ?? model.id }}
                                </option>
                            </template>
                        </template>
                    </select>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { useAppConfigStore } from '@/stores/appConfig';
import Toggle from '@vueform/toggle';
import { watch } from 'vue';
import '@vueform/toggle/themes/default.css';
import { vscode } from '@/utilities/vscode';
import { OutputCommands } from '@/constants/commands';
import { storeToRefs } from 'pinia';

const appConfig = useAppConfigStore();
const { features, providers } = storeToRefs(appConfig);
const llmModels = appConfig.llmModels;

// Provider watcher: Update feature model fallback 
watch(providers, (newVal) => {
    let shouldUpdate = false;
    const updatedProviders = features.value.map((feat) => {
        if (!feat.model) {
            return feat;
        }
        const [providerId, modelId] = feat.model.split(':');
        const provider = newVal.find((p) => p.id === providerId);
        const model = provider?.models.find((m) => m.id === modelId && m.enabled);
        if (!model) {
            shouldUpdate = true;
            return { ...feat, model: undefined };
        }
        return feat;
    });

    if (shouldUpdate) {
        appConfig.copyWith({ features: updatedProviders });
    }
});

const toggleEnableFeat = (featId: string) => {
    const feat = features.value.find((feat) => feat.id === featId)!;

    // Avoid disable chat
    if (feat.id === 'chat') {
        return;
    }

    const enabled = !feat.enabled;
    if (enabled && !feat.model) {
        // TODO: Replace with In-app Alert
        vscode.postMessage({
            command: OutputCommands.SHOW_ALERT,
            data: { message: 'Please select a model for ' + feat.name }
        });
        return;
    } else {
        appConfig.updateFeature(featId, { ...feat, enabled });
    }
}

const selectModelFeat = (featId: string, event: any) => {
    try {
        const model = event.target.value;
        const feat = features.value.find((feat) => feat.id === featId)!;
        appConfig.updateFeature(featId, { ...feat, model });
    } catch (e) {
        // TODO: Replace with In-app Alert
        vscode.postMessage({
            command: OutputCommands.SHOW_ALERT,
            data: { message: 'Failed to select model' }
        });
    }
}
</script>