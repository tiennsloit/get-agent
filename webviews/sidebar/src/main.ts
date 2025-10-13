import { createApp, h, ref } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import Highlight from './directives/hljs';
import { TooltipDirective } from 'vue3-tooltip';
import { useEventBus } from '@vueuse/core';
import { BusEvents } from './constants/busEvent';

import 'vue3-tooltip/tooltip.css';
import './assets/main.css';

// Import development-only styles (vscode theme variable - dark)
if (import.meta.env.DEV) {
    import('@/assets/vscode-variables.css');
}

// Create pinia instance
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Manual handle to force re-render
const appKeyBus = useEventBus<{ prompt: string }>(BusEvents.APP_KEY);
const appKey = ref(0);
appKeyBus.on(() => { appKey.value++; });
const app = createApp({
    setup() {
        return () => h(App, { key: appKey.value });
    }
});

// Register global directives, components, and plugins
app.directive('highlight', Highlight);
app.directive('tooltip', TooltipDirective);
app.use(pinia);
app.mount('#app');