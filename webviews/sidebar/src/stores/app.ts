import { ChatScreen, ChatMode, type AppState } from '@/types/appState';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
    persist: {
        storage: sessionStorage,
    },
    state: (): AppState => ({
        screen: ChatScreen.CHAT,
        chatMode: ChatMode.NORMAL,
    }),
    getters: {
    },
    actions: {
        // Copy with
        copyWith(updates: Partial<AppState>): void {
            this.$state = {
                ...this.$state,
                ...updates,
            };
        },
    },
});
