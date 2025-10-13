import { defineStore } from "pinia";
import type { SettingState } from "@/types/setting";
import type { SETTING_SECTIONS } from "@/constants/setting";
import defaultPreset from "@ext/assets/prompts/presets/default.yaml";
import debugErrorPreset from "@ext/assets/prompts/presets/debug_error.yaml";
import explainCodePreset from "@ext/assets/prompts/presets/explain_code.yaml";
import optimizeCodePreset from "@ext/assets/prompts/presets/optimize_code.yaml";
import reviewCodePreset from "@ext/assets/prompts/presets/review_code.yaml";
import writeDoc from "@ext/assets/prompts/presets/write_doc.yaml";
import writeUnitTest from "@ext/assets/prompts/presets/write_unit_test.yaml";
import type { PromptPreset } from "@/types/promptPreset";


export const useSettingStore = defineStore("setting", {
    state: (): SettingState => ({
        activeSection: null,
        presets: [
            defaultPreset,
            debugErrorPreset,
            explainCodePreset,
            optimizeCodePreset,
            reviewCodePreset,
            writeDoc,
            writeUnitTest
        ],
    }),
    persist: {
        storage: localStorage
    },
    getters: {},
    actions: {
        setActiveSection(section: SETTING_SECTIONS) {
            this.activeSection = section;
        },
        updatePreset(presetName: string, data: PromptPreset) {
            this.presets = this.presets.map(p => {
                if (p.name === presetName) {
                    return { ...data, modified: true };
                }
                return p;
            });
        }
    },
});
