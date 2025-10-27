<template>
  <div class="flex w-80 items-start space-x-2 text-xs mt-4 mb-1">
    <div class="flex-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
      <div class="space-y-3">
        <!-- Overall Understanding -->
        <div>
          <div class="flex items-center justify-between mb-1 cursor-pointer select-none" @click="isExpanded = !isExpanded">
            <span class="text-sm font-medium text-blue-400">Overall Understanding</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold text-blue-300">{{ Math.ceil(understandingLevel * 100) }}%</span>
              <svg
                class="w-4 h-4 text-blue-400 transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
              :style="{ width: `${Math.ceil(understandingLevel * 100)}%` }"></div>
          </div>
        </div>

        <ExpandTransition>
          <div v-if="isExpanded" class="flex flex-col space-y-3">
            <!-- Confidence Breakdown -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div v-for="(score, key) in confidenceScores" :key="key" class="flex flex-col">
                <span class="text-xs text-gray-400 mb-1 capitalize">{{ formatLabel(key) }}</span>
                <div class="flex items-center space-x-2">
                  <div class="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-blue-400 h-full transition-all duration-300" :style="{ width: `${Math.ceil(score * 100)}%` }">
                    </div>
                  </div>
                  <span class="text-xs text-gray-300 w-8 text-right">{{ Math.ceil(score * 100) }}%</span>
                </div>
              </div>
            </div>

            <!-- Iteration Info -->
            <div class="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-gray-400">
              <span v-if="nextPriorities.length > 0" class="italic">
                Next:
                {{ nextPriorities[0] }}
              </span>
            </div>
          </div>
        </ExpandTransition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ExpandTransition from './ExpandTransition.vue';

interface ConfidenceScore {
  architecture: number;
  data_flow: number;
  integration_points: number;
  implementation_details: number;
}

interface Props {
  understandingLevel: number;
  confidenceScore: ConfidenceScore;
  iteration: number;
  nextPriorities?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  nextPriorities: () => []
});
const isExpanded = ref(false);

const confidenceScores = computed(() => props.confidenceScore);

function formatLabel(key: string): string {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
</script>
