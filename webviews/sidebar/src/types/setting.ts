import type { SETTING_SECTIONS } from "@/constants/setting";
import type { PromptPreset } from "./promptPreset";

export interface SettingState {
    activeSection: SETTING_SECTIONS | null;
    presets: PromptPreset[];
}
