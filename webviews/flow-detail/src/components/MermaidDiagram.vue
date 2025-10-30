<template>
  <div class="mermaid-container p-4 w-full overflow-auto">
    <div v-show="loading" class="flex justify-center items-center min-h-[100px] text-white/30">
      <div class="py-5 text-center">Loading diagram...</div>
    </div>
    <div v-show="!loading" ref="mermaidRef" class="mermaid w-full overflow-auto min-h-[100px]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import mermaid from 'mermaid';
import { debounce } from "@/utilities/debounce";

// Props
const props = defineProps<{
  code: string;
}>();

// Refs
const mermaidRef = ref<HTMLElement | null>(null);
// Store the last valid diagram
const lastValidDiagram = ref<string>('');
const loading = ref(true);

// Initialize Mermaid once
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict'
  });

  // Render the diagram after the component is mounted
  if (props.code) {
    nextTick(() => {
      debouncedRender(props.code);
    });
  }
});

// Render diagram when code changes (debounced to avoid excessive re-renders during streaming)
watch(
  () => props.code,
  (newCode) => {
    if (newCode) {
      debouncedRender(newCode);
    }
  }
);

// Render Mermaid diagram
const renderDiagram = async (definition: string) => {
  try {
    // Wait for the ref to be available
    if (!mermaidRef.value) {
      await nextTick();
      if (!mermaidRef.value) {
        console.error('Mermaid ref is not available');
        loading.value = false;
        return;
      }
    }

    // Try to parse the diagram code first to catch syntax errors early
    try {
      await mermaid.parse(definition);
    } catch (parseError) {
      // Show fallback if we have a valid previous diagram
      if (lastValidDiagram.value && mermaidRef.value) {
        try {
          await mermaid.parse(lastValidDiagram.value);
          const { svg, bindFunctions } = await mermaid.render(
            `mermaid-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            lastValidDiagram.value
          );

          if (mermaidRef.value) {
            mermaidRef.value.innerHTML = svg;
            if (bindFunctions) {
              bindFunctions(mermaidRef.value);
            }
          }
        } catch (fallbackParseError) {
        }
      }
      return;
    }

    // If parsing succeeds, render the diagram
    const { svg, bindFunctions } = await mermaid.render(
      `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definition
    );

    if (mermaidRef.value) {
      mermaidRef.value.innerHTML = svg;
      // Bind any functions (like click handlers) if they exist
      if (bindFunctions) {
        bindFunctions(mermaidRef.value);
      }
      // Store the valid diagram code
      lastValidDiagram.value = definition;
      // Hide loading state when render is successful
      loading.value = false;
    }
  } catch (error: unknown) {
    // If we have a last valid diagram, keep showing it
    if (lastValidDiagram.value && mermaidRef.value) {
      try {
        await mermaid.parse(lastValidDiagram.value);
        const { svg, bindFunctions } = await mermaid.render(
          `mermaid-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          lastValidDiagram.value
        );

        if (mermaidRef.value) {
          mermaidRef.value.innerHTML = svg;
          if (bindFunctions) {
            bindFunctions(mermaidRef.value);
          }
          // Successfully rendered fallback
          loading.value = false;
        }
      } catch (fallbackError) { }
    }
  }
};

// Debounced version to avoid excessive re-renders during streaming
const debouncedRender = debounce(renderDiagram, 300);
</script>
