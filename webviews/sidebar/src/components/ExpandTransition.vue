<template>
    <Transition name="expand" @enter="enter" @after-enter="afterEnter" @before-leave="beforeLeave" @leave="leave">
        <slot />
    </Transition>
</template>

<script setup>
const props = defineProps({
    duration: {
        type: Number,
        default: 100 // in milliseconds
    }
});

const getTransitionStyle = (duration) => `height ${duration}ms ease-out`;

const enter = (el) => {
    el.style.height = '0';
    el.offsetHeight;
    el.style.transition = getTransitionStyle(props.duration);
    el.style.height = `${el.scrollHeight}px`;
};

const afterEnter = (el) => {
    el.style.height = 'auto';
};

const beforeLeave = (el) => {
    el.style.height = `${el.scrollHeight}px`;
    el.offsetHeight;
    el.style.transition = getTransitionStyle(props.duration);
};

const leave = (el) => {
    el.style.height = '0';
};
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
    overflow: hidden;
    transition-property: height;
    transition-timing-function: ease-out;
}
</style>