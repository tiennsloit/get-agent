import * as vscode from 'vscode';

export interface StateManagerOptions<T> {
    persist?: boolean;
    storageKey?: string;
    initialState: T;
    onInit?: (state: T) => void | Promise<void>;
}

export interface StateGetter<T> {
    get(): T;
    get<K extends keyof T>(key: K): T[K];
}

export interface StateAction<T> {
    (currentState: T): T | void;
}

export class StateManager<T extends Record<string, any>> {
    private state: T;
    private memento?: vscode.Memento;
    private persist: boolean;
    private storageKey: string;
    private onInitHook?: (state: T) => void | Promise<void>;
    private isInitialized: boolean = false;

    constructor(options: StateManagerOptions<T>) {
        this.state = { ...options.initialState };
        this.persist = options.persist ?? true;
        this.storageKey = options.storageKey ?? 'state';
        this.onInitHook = options.onInit;
    }

    /**
     * Initialize the state manager with VSCode context
     */
    async init(context: vscode.ExtensionContext): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        this.memento = context.globalState;

        // Load persisted state if enabled
        if (this.persist && this.memento) {
            const persistedState = this.memento.get<T>(this.storageKey);
            if (persistedState) {
                this.state = { ...this.state, ...persistedState };
            }
        }

        // Call onInit hook if provided
        if (this.onInitHook) {
            await this.onInitHook(this.state);
        }

        this.isInitialized = true;
    }

    /**
     * Get the entire state or a specific property
     */
    get(): T;
    get<K extends keyof T>(key: K): T[K];
    get<K extends keyof T>(key?: K): T | T[K] {
        if (key === undefined) {
            return { ...this.state };
        }
        return this.state[key];
    }

    /**
     * Update state using an action function
     */
    async dispatch(action: StateAction<T>): Promise<void> {
        const newState = action({ ...this.state });

        // If action returns a new state, use it; otherwise assume mutation
        if (newState !== undefined) {
            this.state = newState;
        }

        // Persist if enabled
        if (this.persist && this.memento) {
            await this.memento.update(this.storageKey, this.state);
        }
    }

    /**
     * Set a specific property directly
     */
    async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
        await this.dispatch(state => {
            state[key] = value;
        });
    }

    /**
     * Merge partial state
     */
    async merge(partialState: Partial<T>): Promise<void> {
        await this.dispatch(state => ({ ...state, ...partialState }));
    }

    /**
     * Reset to initial state
     */
    async reset(initialState?: T): Promise<void> {
        if (initialState) {
            this.state = { ...initialState };
        } else {
            // Reset to original initial state (you'd need to store this)
            throw new Error('Reset requires initial state to be provided');
        }

        if (this.persist && this.memento) {
            await this.memento.update(this.storageKey, this.state);
        }
    }

    /**
     * Enable or disable persistence
     */
    setPersistence(enabled: boolean): void {
        this.persist = enabled;
    }

    /**
     * Clear persisted state
     */
    async clearPersisted(): Promise<void> {
        if (this.memento) {
            await this.memento.update(this.storageKey, undefined);
        }
    }

    /**
     * Subscribe to state changes (basic implementation)
     */
    private listeners: Array<(state: T) => void> = [];

    subscribe(listener: (state: T) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener({ ...this.state }));
    }

    // Override dispatch to include notifications
    async dispatchWithNotification(action: StateAction<T>): Promise<void> {
        await this.dispatch(action);
        this.notifyListeners();
    }
}
