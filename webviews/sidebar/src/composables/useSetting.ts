import type { SETTING_SECTIONS } from "@/constants/setting";
import { useAppStore } from "@/stores/app";
import { useSettingStore } from "@/stores/setting";
import { ChatScreen } from "@/types/appState";

export function useSetting() {
    const open = (section: SETTING_SECTIONS, payload: any = {}) => {
        const appStore = useAppStore();
        const settingStore = useSettingStore();
        appStore.copyWith({ screen: ChatScreen.SETTING });
        settingStore.setActiveSection(section);
    };

    const close = () => {
        const appStore = useAppStore();
        appStore.copyWith({ screen: ChatScreen.CHAT });
    };

    return { open, close };
}