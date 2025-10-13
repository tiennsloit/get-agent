<template>
    <div class="h-screen flex overflow-hidden">
        <!-- TABBAR -->
        <div class="h-full w-10 sticky top-0 border-r border-gray">
            <button
                class="h-10 w-10 border-b border-gray flex items-center justify-center cursor-pointer select-none hover:bg-zinc-500/50"
                @click="onCancel">
                <BackIcon />
            </button>

            <div v-for="comp in configSections" :key="comp.id" v-tooltip:right="comp.name" class="border-b border-gray">
                <button
                    class="h-10 w-10 flex items-center justify-center cursor-pointer select-none hover:bg-zinc-500/50"
                    v-bind:class="{ 'bg-zinc-500/50 border-l-4 border-blue-400': activeSection.id === comp.id }"
                    @click="setActive(comp.id)">
                    <component :is="comp.icon" />
                </button>
            </div>
        </div>

        <!-- MAIN SETTING PAGE -->
        <div class="h-full flex-1 overflow-y-scroll overflow-x-hidden">
            <div class="h-screen">
                <div class="w-full h-10 px-4 flex items-center justify-between border-b border-gray">
                    <p class="font-bold">{{ activeSection.name }}</p>
                </div>

                <div class="flex-1 p-4 pb-16 space-y-10 overflow-y-auto">
                    <component :is="activeSection.component" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue';
import BackIcon from '@/components/icons/BackIcon.vue';
import CloudIcon from '@/components/icons/CloudIcon.vue';
import DesktopIcon from '@/components/icons/DesktopIcon.vue';
import InfoIcon from '@/components/icons/InfoIcon.vue';
import SparkleIcon from '@/components/icons/SparkleIcon.vue';
import StorageIcon from '@/components/icons/StorageIcon.vue';
import TextRightIcon from '@/components/icons/TextRightIcon.vue';
import CreditSection from '@/components/settings/CreditSection.vue';
import FeaturesSection from '@/components/settings/FeaturesSection.vue';
import LocalSection from '@/components/settings/LocalSection.vue';
import PromptSection from '@/components/settings/PromptSection.vue';
import ProviderSection from '@/components/settings/ProviderSection.vue';
import StorageSection from '@/components/settings/StorageSection.vue';
import { useAppStore } from '@/stores/app';
import { useSettingStore } from '@/stores/setting';
import { ChatScreen } from '@/types/appState';
import { SETTING_SECTIONS } from '@/constants/setting';

// Define stores
const appStore = useAppStore();
const settingStore = useSettingStore();

// Define components
const configSections = [
    {
        id: SETTING_SECTIONS.FEATURES,
        name: 'Features',
        icon: markRaw(SparkleIcon),
        component: markRaw(FeaturesSection),
    },
    {
        id: SETTING_SECTIONS.LOCAL,
        name: 'Local Models',
        icon: markRaw(DesktopIcon),
        component: markRaw(LocalSection),
    },
    {
        id: SETTING_SECTIONS.PROVIDERS,
        name: 'AI Providers',
        icon: markRaw(CloudIcon),
        component: markRaw(ProviderSection),
    },
    {
        id: SETTING_SECTIONS.PROMPTS,
        name: 'Prompts',
        icon: markRaw(TextRightIcon),
        component: markRaw(PromptSection),
    },
    {
        id: SETTING_SECTIONS.STORAGE,
        name: 'Storage',
        icon: markRaw(StorageIcon),
        component: markRaw(StorageSection),
    },
    {
        id: SETTING_SECTIONS.CREDIT,
        name: 'Credit',
        icon: markRaw(InfoIcon),
        component: markRaw(CreditSection),
    },
];
const activeSection = computed(() => {
    return configSections.find((sec) => sec.id === settingStore.activeSection) || configSections[0];
});

const setActive = (id: string) => {
    settingStore.setActiveSection(id as SETTING_SECTIONS);
}

const onCancel = () => {
    appStore.copyWith({ screen: ChatScreen.CHAT });
}
</script>