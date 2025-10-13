import { defineStore } from 'pinia';
import { createChatState } from './state';
import { chatGetters } from './getters';
import { chatActions } from './actions';

export const useChatStore = defineStore('chat', {
  persist: {
    storage: localStorage,
    key: 'chat',
  },
  state: createChatState,
  getters: chatGetters,
  actions: chatActions,
});