<template>
  <div class="code-block rounded border my-2 overflow-hidden">
    <div class="flex items-center border-b pl-3 text-xs space-x-2">
      <div class="flex-1">{{ language }}</div>
      <div class="flex">
        <div class="h-6 border-l"></div>
        <button class="px-2 cursor-pointer hover:bg-zinc-500/25" @click="copyCode">
          {{ copied ? "Copied!" : "Copy" }}
        </button>
        <div class="h-6 border-l"></div>
        <button v-if="!isPlaintext" class="px-2 cursor-pointer hover:bg-zinc-500/25" @click="submitCode">
          {{ isCommand ? "Run" : "Insert" }}
        </button>
      </div>
    </div>
    <div class="w-full overflow-hidden">
      <div v-highlight>
        <pre><code :class="'language-' + mappedLanguage">{{ code }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { vscode } from "@/utilities/vscode";
import { FILE_EXTENSION_MAP } from "@/directives/hljs";
import { OutputCommands } from "@/constants/commands";

// Props
const props = defineProps(["code", "classes"]);

// State
let copied = ref(false);

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

// Compute is command
const isCommand = computed(() => {
  const commandLang = [
    "bash",
    "sh",
    "zsh",
    "powershell",
    "cmd",
    "batch",
    "powershell",
    "batch",
  ];
  return commandLang.includes(language.value);
});

// Compute is plaintext
const isPlaintext = computed(() => {
  return mappedLanguage.value === "plaintext";
});

// Copy code
const copyCode = () => {
  navigator.clipboard.writeText(props.code);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1000);
};

// Submit code
const submitCode = () => {
  vscode.postMessage({
    command: isCommand.value ? OutputCommands.RUN_COMMAND : OutputCommands.INSERT_CODE,
    data: {
      code: props.code
    },
  });
};
</script>
