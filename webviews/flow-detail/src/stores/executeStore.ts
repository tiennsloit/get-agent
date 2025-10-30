import { defineStore } from 'pinia';
import { vscode } from '@/utilities/vscode';
import type { TodoItem } from '../../../../shared/models/flow';

export interface AgentStep {
    type: 'log' | 'thought' | 'file-change' | 'terminal-command';
    content: string;
    timestamp?: string;
    metadata?: any;
}

interface ExecuteState {
    // TODO list state
    todoItems: TodoItem[];
    currentTodoIndex: number;
    isLoadingTodos: boolean;
    todoError: string | null;

    // Agent execution state
    agentSteps: AgentStep[];
    isExecuting: boolean;
    executionError: string | null;

    // Message event handler
    messageHandler: ((event: MessageEvent) => void) | null;
}

export const useExecuteStore = defineStore('execute', {
    state: (): ExecuteState => ({
        todoItems: [],
        currentTodoIndex: -1,
        isLoadingTodos: false,
        todoError: null,
        agentSteps: [],
        isExecuting: false,
        executionError: null,
        messageHandler: null
    }),

    getters: {
        /**
         * Check if TODO list is loaded
         */
        hasTodoList(): boolean {
            return this.todoItems.length > 0;
        },

        /**
         * Get current TODO item
         */
        currentTodoItem(): TodoItem | null {
            if (this.currentTodoIndex >= 0 && this.currentTodoIndex < this.todoItems.length) {
                return this.todoItems[this.currentTodoIndex];
            }
            return null;
        },

        /**
         * Get TODO state for an item by index
         */
        getTodoState() {
            return (index: number): 'todo' | 'inprogress' | 'done' => {
                // First check if the item has its own status
                const item = this.todoItems[index];
                if (item?.status) {
                    return item.status;
                }
                
                // Otherwise, calculate based on current index
                if (index < this.currentTodoIndex) {
                    return 'done';
                } else if (index === this.currentTodoIndex) {
                    return 'inprogress';
                } else {
                    return 'todo';
                }
            };
        }
    },

    actions: {
        /**
         * Initialize the store - set up message listener
         */
        initialize() {
            console.log('[ExecuteStore] Initializing - setting up message listener');
            this.setupMessageListener();
        },

        /**
         * Clean up - remove message listener
         */
        cleanup() {
            this.removeMessageListener();
        },

        /**
         * Set TODO items from API response
         */
        setTodoItems(items: TodoItem[]) {
            // Initialize all items with 'todo' status if not set
            this.todoItems = items.map(item => ({
                ...item,
                status: item.status || 'todo'
            }));
            this.currentTodoIndex = 0; // Start with first item
            // Set first item to inprogress
            if (this.todoItems.length > 0) {
                this.todoItems[0].status = 'inprogress';
            }
            this.isLoadingTodos = false;
            this.todoError = null;
            console.log(`[ExecuteStore] TODO items set: ${items.length} items`);
        },

        /**
         * Update current TODO index and status
         */
        setCurrentTodoIndex(index: number) {
            if (index >= 0 && index < this.todoItems.length) {
                // Mark previous items as done
                for (let i = 0; i < index; i++) {
                    this.todoItems[i].status = 'done';
                }
                // Mark current item as inprogress
                this.todoItems[index].status = 'inprogress';
                // Mark future items as todo
                for (let i = index + 1; i < this.todoItems.length; i++) {
                    this.todoItems[i].status = 'todo';
                }
                this.currentTodoIndex = index;
                console.log(`[ExecuteStore] Current TODO index updated to: ${index}`);
            }
        },

        /**
         * Mark a TODO item as complete and move to next
         */
        completeTodoItem(index: number) {
            if (index >= 0 && index < this.todoItems.length) {
                this.todoItems[index].status = 'done';
                // Move to next item if available
                if (index + 1 < this.todoItems.length) {
                    this.setCurrentTodoIndex(index + 1);
                }
                // Sync progress to extension
                this.syncProgressToExtension();
            }
        },

        /**
         * Update status of a specific TODO item
         */
        updateTodoItemStatus(index: number, status: 'todo' | 'inprogress' | 'done') {
            if (index >= 0 && index < this.todoItems.length) {
                this.todoItems[index].status = status;
                console.log(`[ExecuteStore] TODO item ${index} status updated to: ${status}`);
                // Sync progress to extension
                this.syncProgressToExtension();
            }
        },

        /**
         * Sync progress count to extension
         */
        syncProgressToExtension() {
            const doneCount = this.todoItems.filter(item => item.status === 'done').length;
            const totalCount = this.todoItems.length;
            
            vscode.postMessage({
                command: 'updateProgress',
                data: {
                    done: doneCount,
                    total: totalCount
                }
            });
            
            console.log(`[ExecuteStore] Progress synced: ${doneCount}/${totalCount}`);
        },

        /**
         * Add an agent step to the execution log
         */
        addAgentStep(step: AgentStep) {
            this.agentSteps.push({
                ...step,
                timestamp: step.timestamp || new Date().toISOString()
            });
        },

        /**
         * Clear all agent steps
         */
        clearAgentSteps() {
            this.agentSteps = [];
        },

        /**
         * Set execution state
         */
        setExecutionState(isExecuting: boolean) {
            this.isExecuting = isExecuting;
            if (isExecuting) {
                this.executionError = null;
            }
        },

        /**
         * Set execution error
         */
        setExecutionError(error: string | null) {
            this.executionError = error;
            this.isExecuting = false;
        },

        /**
         * Set TODO loading state
         */
        setLoadingTodos(loading: boolean) {
            this.isLoadingTodos = loading;
            if (loading) {
                this.todoError = null;
            }
        },

        /**
         * Set TODO error
         */
        setTodoError(error: string | null) {
            this.todoError = error;
            this.isLoadingTodos = false;
        },

        /**
         * Reset store to initial state
         */
        reset() {
            this.todoItems = [];
            this.currentTodoIndex = -1;
            this.isLoadingTodos = false;
            this.todoError = null;
            this.agentSteps = [];
            this.isExecuting = false;
            this.executionError = null;
        },

        /**
         * Handle TODO generated message from extension
         */
        handleTodoGenerated(data: { todoItems: TodoItem[] }) {
            console.log('[ExecuteStore] TODO generated', data);
            this.setTodoItems(data.todoItems);
        },

        /**
         * Handle execution step update from extension
         */
        handleExecutionStepUpdate(data: { step: AgentStep }) {
            console.log('[ExecuteStore] Execution step update', data);
            this.addAgentStep(data.step);
        },

        /**
         * Handle execution complete from extension
         */
        handleExecutionComplete(data: { success: boolean; summary: string }) {
            console.log('[ExecuteStore] Execution complete', data);
            this.setExecutionState(false);
            this.addAgentStep({
                type: 'log',
                content: `Execution completed: ${data.summary}`
            });
        },

        /**
         * Handle execution error from extension
         */
        handleExecutionError(data: { error: string; recoverable: boolean }) {
            console.log('[ExecuteStore] Execution error', data);
            this.setExecutionError(data.error);
            this.addAgentStep({
                type: 'log',
                content: `Error: ${data.error}`
            });
        },

        /**
         * Handle TODO generation error from extension
         */
        handleTodoError(data: { error: string }) {
            console.log('[ExecuteStore] TODO generation error', data);
            this.setTodoError(data.error);
        },

        /**
         * Restore execution data from flow object
         */
        restoreFromFlowData(executionData: any) {
            if (!executionData) {
                console.log('[ExecuteStore] No execution data to restore');
                return;
            }

            console.log('[ExecuteStore] Restoring execution data', {
                hasTodoList: !!executionData.todoList,
                todoCount: executionData.todoList?.length ?? 0,
                currentIndex: executionData.currentTodoIndex ?? -1,
                agentStepsCount: executionData.agentSteps?.length ?? 0
            });

            try {
                // Restore TODO list
                if (executionData.todoList && Array.isArray(executionData.todoList)) {
                    this.todoItems = executionData.todoList;
                    console.log(`[ExecuteStore] Restored ${executionData.todoList.length} TODO items`);
                }

                // Restore current TODO index
                if (typeof executionData.currentTodoIndex === 'number') {
                    this.currentTodoIndex = executionData.currentTodoIndex;
                    console.log(`[ExecuteStore] Restored current TODO index: ${executionData.currentTodoIndex}`);
                }

                // Restore agent steps
                if (executionData.agentSteps && Array.isArray(executionData.agentSteps)) {
                    this.agentSteps = executionData.agentSteps;
                    console.log(`[ExecuteStore] Restored ${executionData.agentSteps.length} agent steps`);
                }

                console.log('[ExecuteStore] Execution data restoration complete');
            } catch (error) {
                console.error('[ExecuteStore] Error restoring execution data:', error);
            }
        },

        /**
         * Request retry of TODO generation
         */
        retryTodoGeneration(flowId: string) {
            console.log('[ExecuteStore] Retrying TODO generation');
            this.setLoadingTodos(true);
            vscode.postMessage({
                command: 'retryTodoGeneration',
                data: { flowId }
            });
        },

        /**
         * Set up message listener for extension communication
         */
        setupMessageListener() {
            console.log('[ExecuteStore] Setting up message listener');
            this.messageHandler = (event: MessageEvent) => {
                const message = event.data;
                console.log('[ExecuteStore] Received message:', message.command);
                
                switch (message.command) {
                    case 'todoGenerationStarted':
                        this.setLoadingTodos(true);
                        break;
                    case 'todoGenerated':
                        this.handleTodoGenerated(message.data);
                        break;
                    case 'todoError':
                        this.handleTodoError(message.data);
                        break;
                    case 'executionStepUpdate':
                        this.handleExecutionStepUpdate(message.data);
                        break;
                    case 'executionComplete':
                        this.handleExecutionComplete(message.data);
                        break;
                    case 'executionError':
                        this.handleExecutionError(message.data);
                        break;
                    case 'flowDataUpdate':
                        // Restore execution data if available
                        if (message.data.flow?.executionData) {
                            this.restoreFromFlowData(message.data.flow.executionData);
                        }
                        break;
                }
            };

            window.addEventListener('message', this.messageHandler);
        },

        /**
         * Remove message listener
         */
        removeMessageListener() {
            if (this.messageHandler) {
                window.removeEventListener('message', this.messageHandler);
                this.messageHandler = null;
            }
        }
    }
});
