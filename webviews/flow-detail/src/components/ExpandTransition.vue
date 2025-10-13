<template>
    <Transition name="expand" @enter="enter" @after-enter="afterEnter" @before-leave="beforeLeave" @leave="leave">
        <slot />
    </Transition>
</template>

<script setup>
const props = defineProps({
    duration: {
        type: Number,
        default: 300 // in milliseconds
    }
});

const getTransitionStyle = (duration) => `height ${duration}ms ease-out`;

const enter = (el) => {
    el.style.height = '0';
    el.offsetHeight; // Trigger reflow
    el.style.transition = getTransitionStyle(props.duration);
    el.style.height = `${el.scrollHeight}px`;
};

const afterEnter = (el) => {
    el.style.height = 'auto';
};

const beforeLeave = (el) => {
    if (el.style.height === 'auto') {
        el.style.height = `${el.scrollHeight}px`;
    }
    el.offsetHeight; // Trigger reflow
};

const leave = (el) => {
    el.style.transition = getTransitionStyle(props.duration);
    el.style.height = '0';
};
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
    overflow: hidden;
    transition: height 300ms ease-out;
}

.expand-enter-from,
.expand-leave-to {
    height: 0;
}
</style>