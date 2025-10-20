import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import { TooltipDirective } from 'vue3-tooltip';

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
const app = createApp(App);

// Register global directives, components, and plugins
app.directive('tooltip', TooltipDirective);
app.use(pinia);
app.mount('#app');