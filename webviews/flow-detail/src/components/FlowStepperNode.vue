<template>
    <div class="flex items-center cursor-pointer" @click="handleClick">
        <div :class="[
            'w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium text-white',
            state === 'active'
                ? 'bg-white/30'
                : state === 'done'
                    ? 'bg-green-800'
                    : 'bg-white/30 text-white/50'
        ]">
            <span v-if="state === 'done'">✓</span>
            <span v-else>{{ stepNumber }}</span>
        </div>
        <span :class="[
            'ml-2 text-xs font-medium',
            state === 'active' ? 'text-white/80' : 
            state === 'done' ? 'text-green-800' : 'text-white/30'
        ]">
            {{ label }}
        </span>
    </div>
</template>

<script setup lang="ts">
interface Props {
    stepNumber: number;
    label: string;
    state: 'waiting' | 'active' | 'done';
}

const props = defineProps<Props>();
const emit = defineEmits(['stepClick']);

const handleClick = () => {
    emit('stepClick', props.stepNumber);
};
</script>