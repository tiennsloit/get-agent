<template>
  <div class="code-block rounded border border-dashed border-white/30 my-2 overflow-hidden w-full">
    <MermaidDiagram v-if="isMermaid" :code="code" />
    <div v-else v-highlight>
      <pre><code :class="'language-' + mappedLanguage">{{ code }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FILE_EXTENSION_MAP } from "@/directives/hljs";
import MermaidDiagram from "./MermaidDiagram.vue";

// Props
const props = defineProps(["code", "classes"]);

// Compute language from class
const language = computed(() => {
  try {
    if (!props.classes || !(props.classes instanceof Array)) {
      // Code is not fully loaded
      return "plaintext";
    }
    let languageClass = props.classes.find((c) => c.startsWith("language-"));
    return languageClass?.replace("language-", "") || "plaintext";
  } catch (e) {
    return "plaintext";
  }
});

// Compute mapped language
const mappedLanguage = computed(() => {
  if (Object.keys(FILE_EXTENSION_MAP).includes(language.value)) {
    return FILE_EXTENSION_MAP[language.value];
  }
  return language.value;
});

const isMermaid = computed(() => {
  return mappedLanguage.value === "mermaid";
});
</script>
