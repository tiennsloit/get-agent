import { defineStore } from "pinia";
import { vscode } from "@/utilities/vscode";
import { OutputCommands } from "@/constants/commands";
import type { AppConfig, FeatureConfig } from "@/types/appConfig";

export const useAppConfigStore = defineStore("appConfig", {
  persist: {
    storage: localStorage
  },
  state: (): AppConfig => ({
    version: "0.0.0",
    llmModels: [],
    features: [],
    providers: []
  }),
  getters: {},
  actions: {
    // Update app config
    copyWith(updates: Partial<AppConfig>, skipSync: boolean = false): void {
      // Update state
      this.$state =
      {
        ...this.$state,
        ...updates,
      };

      // Sync message to extension
      if (!skipSync) {
        vscode.postMessage({
          command: OutputCommands.UPDATE_APP_CONFIG,
          data: JSON.parse(JSON.stringify(this.$state))
        });
      }
    },
    updateFeature(featureId: string, data: FeatureConfig) {
      this.features = this.features.map((feature) => {
        if (feature.id === featureId) {
          return data;
        } else {
          return feature;
        }
      });
    }
  },
});
