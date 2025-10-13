import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import Highlight from './directives/hljs';
import './assets/style.css';
import App from './App.vue';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.directive('highlight', Highlight);
app.use(pinia);
app.mount('#app');