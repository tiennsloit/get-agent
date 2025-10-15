<template>
  <div class="w-full flex flex-col space-y-2 p-4 rounded bg-white/5 border border-white/30">
    <div class="text-xs font-medium">{{ analysis['core_requirement']['summary'] }}</div>
    <div class="text-xs">{{ analysis['core_requirement']['main_objective'] }}</div>
    <small class="grid grid-cols-2 gap-1">
      <div class="rounded-lg bg-white/10 px-2 py-1">
        <p class="font-light">Integration</p>
        <p class="font-semibold uppercase">
          {{ analysis['complexity_factors']['integration_complexity'] }}
        </p>
      </div>
      <div class="rounded-lg bg-white/10 px-2 py-1">
        <p class="font-light">Testing</p>
        <p class="font-semibold uppercase overflow-hidden">
          {{ analysis['complexity_factors']['integration_complexity'] }}
        </p>
      </div>
      <div class="rounded-lg bg-white/10 px-2 py-1">
        <p class="font-light">Refactoring</p>
        <p class="font-semibold uppercase">
          {{ analysis['complexity_factors']['integration_complexity'] }}
        </p>
      </div>
      <div class="rounded-lg bg-white/10 px-2 py-1">
        <p class="font-light">External</p>
        <p class="font-semibold uppercase">
          {{ analysis['complexity_factors']['integration_complexity'] }}
        </p>
      </div>
    </small>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  analysis: any;
}>();
</script>