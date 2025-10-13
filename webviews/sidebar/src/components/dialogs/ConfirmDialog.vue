<template>
    <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded shadow-lg p-6 w-96">
            <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
            <p class="mb-6">{{ message }}</p>
            <div class="flex justify-end space-x-4">
                <button @click="cancel" class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
                    Cancel
                </button>
                <button @click="confirm" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Confirm
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { useConfirmDialog } from '@vueuse/core'

const props = defineProps<{
    title: string
    message: string
}>()

const emit = defineEmits<{
    (e: 'confirm'): void
    (e: 'cancel'): void
}>()

const confirm = () => emit('confirm')
const cancel = () => emit('cancel')

const isVisible = useConfirmDialog()
</script>