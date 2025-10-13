import { defineStore } from "pinia";
import type { ActiveFileInfo, CodeStructure, ContextState } from "@/types/context";

export const useContextStore = defineStore("context", {
    persist: {
        storage: sessionStorage
    },
    state: (): ContextState => ({
        activeFile: null,
        codebase: null,
    }),
    getters: {},

    actions: {
        // Set code structure
        setCodeStructure(structure: CodeStructure): void {
            this.codebase = structure;
        },
        // Update active file info
        setActiveFileInfo(fileInfo: ActiveFileInfo): void {
            this.activeFile = fileInfo;
        },
    }
});
