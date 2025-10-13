<template>
    <div class="textarea-container flex-1" :style="{ height: textareaHeight + 'px' }">
        <textarea ref="textarea" class="input-textarea" v-model="inputText" @input="handleInput" @scroll="syncScroll"
            @click="handleClick" @keydown="handleKeydown" @keyup="checkTrigger" :placeholder="placeholder"
            :disabled="disabled"></textarea>
        <div ref="preview" class="preview-div" v-bind:class="{ 'disabled': disabled }" v-html="highlightedText">
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue';

const props = defineProps({
    placeholder: {
        type: String,
        default: 'Type a message...'
    },
    modelValue: {
        type: String,
        default: ''
    },
    minHeight: {
        type: Number,
        default: 45
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'triggerDetected']);

const textarea = ref(null);
const preview = ref(null);
const inputText = ref(props.modelValue);
const textareaHeight = ref(props.minHeight);
const lastTriggerEvent = ref(null);

const highlightedText = computed(() => {
    if (!inputText.value) return '';

    let result = inputText.value;

    // Replace context patterns
    result = result.replace(/@[^\s]+/g, match =>
        `<span class="context-pattern">${match}</span>`
    );

    // Replace command patterns
    result = result.replace(
        /\/(test|docstring|review|optimize|explain)\b/gi,
        match => `<span class="command-pattern">${match}</span>`
    );

    // Replace newlines with <br> for proper display
    return result.replace(/\n/g, '<br>');
});

watch(() => props.modelValue, (newVal) => {
    inputText.value = newVal;
});

watch(inputText, (newVal) => {
    emit('update:modelValue', newVal);
});

const handleInput = () => {
    resizeTextarea();
    checkTrigger();
};

const handleClick = () => {
    nextTick(() => {
        checkTrigger();
    });
};

const handleKeydown = (e) => {
    if (['Space', 'Enter'].includes(e.code)) {
        cancelTrigger();
    }
};

const checkTrigger = () => {
    if (!textarea.value) return;

    const cursorPos = textarea.value.selectionStart;
    const textBeforeCursor = inputText.value.substring(0, cursorPos);

    // Find the last / or @ before cursor with no space in between
    const lastTriggerPos = Math.max(
        textBeforeCursor.lastIndexOf('/'),
        textBeforeCursor.lastIndexOf('@')
    );

    if (lastTriggerPos === -1) {
        cancelTrigger();
        return;
    }

    // Check if there's any space between trigger and cursor
    const textAfterTrigger = textBeforeCursor.substring(lastTriggerPos + 1);
    if (textAfterTrigger.includes(' ')) {
        cancelTrigger();
        return;
    }

    const triggerChar = inputText.value[lastTriggerPos];
    const triggerText = textAfterTrigger;

    // Only update if different from last trigger
    if (!lastTriggerEvent.value ||
        lastTriggerEvent.value.position !== lastTriggerPos ||
        lastTriggerEvent.value.text !== triggerText) {

        lastTriggerEvent.value = {
            trigger: triggerChar,
            text: triggerText,
            position: lastTriggerPos
        };
        emit('triggerDetected', lastTriggerEvent.value);
    }
};

const cancelTrigger = () => {
    if (lastTriggerEvent.value) {
        lastTriggerEvent.value = null;
        emit('triggerDetected', null);
    }
};

const resizeTextarea = () => {
    nextTick(() => {
        if (preview.value) {
            textareaHeight.value = Math.max(props.minHeight, preview.value.scrollHeight);
        }
    });
};

const syncScroll = () => {
    if (preview.value && textarea.value) {
        preview.value.scrollTop = textarea.value.scrollTop;
    }
};

const focus = () => {
    textarea.value?.focus();
};

const clear = () => {
    inputText.value = '';
    resizeTextarea();
};

onMounted(() => {
    resizeTextarea();
});

defineExpose({
    focus,
    clear
});
</script>

<style scoped>
.textarea-container {
    position: relative;
    transition: border-color 0.2s;
}

.input-textarea {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    padding: 10px;
    font-family: inherit;
    font-size: inherit;
    color: rgba(0, 0, 0, 0.01); /* Nearly transparent but not completely */
    background-color: transparent;
    caret-color: #333; /* Visible cursor color */
    text-shadow: 0 0 0 transparent; /* Ensures text remains invisible */
    resize: none;
    overflow: hidden;
    border: none;
    z-index: 2;
}

.input-textarea:focus {
    outline: none;
}

.input-textarea::selection {
    background-color: rgba(0, 123, 255, 0.3); /* Selection highlight */
}

.preview-div {
    width: 100%;
    min-height: 20px;
    padding: 10px;
    font-family: inherit;
    font-size: inherit;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
    pointer-events: none; /* Prevents interference with textarea interaction */
}

.preview-div.disabled {
    opacity: 0.5;
}

.context-pattern {
    color: #4CAF50;
    font-weight: bold;
}

.command-pattern {
    color: #2196F3;
    font-weight: bold;
}
</style>