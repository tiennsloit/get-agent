<template>
    <div class="flex flex-col space-y-2">
        <div class="text-muted text-sm font-semibold">About</div>
        <div class="text-muted text-sm">
            Say hello to GoNext, the AI Coding Assistant that’s almost as excited about your code as you are! Tired of
            wrestling with bugs at 2 a.m.? GoNext doesn’t judge—it just brings you clever suggestions, lightning-fast
            completions, and the occasional digital high five. Whether you’re coding like a pro or googling “how to
            center a
            div” for the hundredth time, GoNext is your cheerful sidekick, making every line of code a little more fun.
            Warning: may cause spontaneous bursts of productivity and excessive grinning!
        </div>
        <div class="text-muted text-sm font-semibold">Authors</div>
        <div class="flex space-x-2 text-muted text-sm text-blue-500">
            <span v-for="author in authors" class="cursor-pointer">{{ author }}</span>
        </div>
        <div class="text-muted text-sm font-semibold">Version</div>
        <div class="text-muted text-sm">{{ version }}</div>
    </div>
</template>

<script setup lang="ts">
import { useAppConfigStore } from '@/stores/appConfig';
const configStore = useAppConfigStore();
const authors = ['@hienth', '@tienns'];
const version = configStore.version;
</script>