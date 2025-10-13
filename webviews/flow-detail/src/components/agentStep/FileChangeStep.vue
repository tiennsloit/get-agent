<template>
    <div class="group rounded border border-white/10 p-1.5 bg-white/3 text-xs">
        <div class="flex items-center gap-2 justify-between overflow-hidden">
            <div class="grow w-full truncate flex gap-2 items-center">
                <FileSolidIcon />
                <span class="text-white">{{ step.filename }}</span>
                <small class="text-white/50">{{ step.path }}</small>
            </div>

            <small class="flex-shrink flex space-x-2 items-center">
                <span> +{{ step.linesAdded }}</span>
                <span class="font-semibold text-green-700">{{ step.action }}</span>
                <span class="font-medium">
                    {{ step.status }}
                </span>
            </small>
        </div>
    </div>
</template>

<script setup>
import FileSolidIcon from '../icons/FileSolidIcon.vue';


defineProps({
    step: {
        type: Object,
        required: true
    }
});
</script>