import * as vscode from "vscode";
import { StateManager } from "./stateManager";
import {
    ExtensionState,
    FeatureConfig,
    LocalModelConfig,
    ProviderConfig,
} from "./types";

class ConfigState {
    // Properties
    private stateManager: StateManager<ExtensionState>;

    // Getters
    public get state(): ExtensionState {
        return this.stateManager.get();
    }
    public get features(): FeatureConfig[] {
        return this.state.features.values;
    }
    public get providers(): ProviderConfig[] {
        return this.state.providers.values;
    }
    public get llmModels(): LocalModelConfig[] {
        return this.state.models.values.llm;
    }
    public get embeddingModel(): LocalModelConfig | null {
        return this.state.models.values.embedding;
    }

    // Constructor
    constructor() {
        this.stateManager = new StateManager<ExtensionState>({
            persist: true,
            storageKey: 'state-config',
            initialState: {
                features: { version: "0.0.0", values: [] },
                providers: { version: "0.0.0", values: [] },
                models: {
                    version: "0.0.0", values: {
                        llm: [],
                        embedding: null
                    }
                },
            },
        });
    }

    /**
     * Called when the extension is activated.
     * Initializes the state manager and subscribes to state changes.
     * @param context The extension context.
     */
    public async onInit(context: vscode.ExtensionContext): Promise<void> {
        // Init the state manager
        this.stateManager.init(context);

        // Subscribe to changes
        const unsubscribe = this.stateManager.subscribe((state) => {
            console.log("State changed:", state);
        });

        // Unsubscribe when desposed
        context.subscriptions.push({ dispose: unsubscribe });
    }

    /**
     * Updates the configuration state.
     * Merges the given updates into the existing state.
     * @param updates The partial state to update.
     */
    public update(updates: Partial<ExtensionState>): void {
        this.stateManager.dispatch((state) => ({
            ...state,
            ...updates,
        }));
    }

    /**
     * Updates the status of a model in the configuration state.
     * @param id The id of the model to update.
     * @param status The new status of the model.
     **/
    public updateModelStatus(
        id: string,
        status: "downloading" | "downloaded" | "not-downloaded"
    ): void {
        if (this.embeddingModel?.id === id) {
            // Update embedding model
            this.update(
                {
                    models: {
                        version: this.state.models.version,
                        values: {
                            embedding: { ...this.embeddingModel, status },
                            llm: this.llmModels
                        }
                    }
                }
            );
        } else {
            // Update LLM models
            this.update({
                models: {
                    version: this.state.models.version,
                    values: {
                        embedding: this.embeddingModel,
                        llm: this.llmModels.map((model) => {
                            if (model.id === id) {
                                return { ...model, status };
                            }
                            return model;
                        })
                    }
                }
            });
        }
    }

    /**
     * Returns the provider with the given id, or undefined if no provider matches.
     * @param id The id of the provider to retrieve.
     */
    public getProvider(id: string): ProviderConfig | undefined {
        return this.providers.find((provider) => provider.id === id);
    }

    /**
     * Returns the feature with the given id, or undefined if no feature matches.
     * @param id The id of the feature to retrieve.
     */
    public getFeature(id: string): FeatureConfig | undefined {
        return this.features.find((feature) => feature.id === id);
    }
}

export const configState = new ConfigState();
