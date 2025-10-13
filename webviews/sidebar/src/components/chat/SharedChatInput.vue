<template>
  <div class="mx-2 mb-3 border border-gray rounded overflow-hidden flex flex-col">
    <div class="max-h-96 overflow-x-hidden border-b border-gray overflow-y-auto">
      <ChatContext :trigger="contextTrigger" :text="contextText" @onSelected="handleContextSelected" />
      <div class="flex space-x-1 justify-between">
        <ChatInput v-model="inputValue" placeholder="Type / for command or @ for context"
          @keydown="handleTextareaKeydown" @triggerDetected="triggerDetected" :disabled="isLoading" ref="chatInput" />
      </div>
    </div>
    <div class="w-full flex overflow-hidden">
      <div class="flex-1 overflow-hidden px-2 flex space-x-1 py-1 px-2">
        <slot name="context-selector" />
      </div>
      <div
        class="flex-shrink flex items-center justify-center border-l border-gray hover:bg-gray-500/20 cursor-pointer">
        <button v-if="isLoading" class="flex px-2 w-full h-full items-center justify-center cursor-pointer"
          @click="stopMessage">
          <div class="w-6 h-6 relative">
            <div class="h-full w-full border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
            <div class="h-full w-full absolute top-0 flex items-center justify-center">
              <StopIcon class="text-red-500" />
            </div>
          </div>
        </button>
        <button v-else class="flex px-2 w-full h-full items-center justify-center cursor-pointer" @click="sendMessage">
          <SendIcon class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SendIcon from '../icons/SendIcon.vue'
import ChatInput from './ChatInput.vue'
import StopIcon from '../icons/StopIcon.vue'
import ChatContext from './ChatContext.vue'
import SparkleIcon from '../icons/SparkleIcon.vue'
import { vscode } from '@/utilities/vscode'
import { OutputCommands } from '@/constants/commands'

// Instance type
type ChatInputInstance = InstanceType<typeof ChatInput>

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  stop: []
}>()

const inputValue = ref<string>('')
const chatInput = ref<ChatInputInstance | null>(null)
const contextTrigger = ref<string | undefined>()
const contextTriggerPosition = ref<number>(-1)
const contextText = ref<string | undefined>()

// Handle textarea keydown
const handleTextareaKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    sendMessage()
  }
}

// Trigger detected
const triggerDetected = (params: { trigger: string; text: string; position: number } | null) => {
  if (!params) {
    contextTrigger.value = undefined
    contextText.value = undefined
    contextTriggerPosition.value = -1
    return
  }
  const { trigger, text, position } = params
  contextTrigger.value = trigger
  contextText.value = text
  contextTriggerPosition.value = position
}

// Handle context selected
const handleContextSelected = (value: string) => {
  if (!contextTrigger.value) return
  const startPos = contextTriggerPosition.value + 1
  const endPos = startPos + (contextText.value?.length ?? 0)

  inputValue.value = inputValue.value.substring(0, startPos) + value + ' ' + inputValue.value.substring(endPos)

  // Refocus input
  chatInput.value!.focus()

  // Clear context
  contextTrigger.value = undefined
  contextText.value = undefined
  contextTriggerPosition.value = -1
}

// Send message function
const sendMessage = async (): Promise<void> => {
  if (!inputValue.value) return
  emit('send', inputValue.value)
  chatInput.value!.clear()
  chatInput.value!.focus()

  // Workaround for clearing the textarea
  setTimeout(() => {
    inputValue.value = ''
  }, 0)
}

// Stop message function
const stopMessage = async (): Promise<void> => {
  emit('stop')
}

// Expose input value for parent to sync
defineExpose({
  inputValue
})
</script>