<template>
    <div class="flex justify-end p-2">
        <div class="flex flex-col items-end max-w-[90%]">
            <div class="flex items-center mb-1">
                <span class="text-sm font-semibold chat-name ml-1">You</span>
                <div class="w-6 h-6 bg-white/20 flex items-center justify-center text-white rounded-full ml-2">
                    <PersonIcon />
                </div>
            </div>
            <div class="w-full p-3 rounded-xl bg-white/10 rounded-br-sm break-words">
                <p class="text-right" v-html="message"></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import PersonIcon from './icons/PersonIcon.vue';


defineProps({
    avatar: {
        type: String,
        default: "https://avatar.iran.liara.run/public"
    },
    message: {
        type: String,
        required: true,
    }
});
</script>