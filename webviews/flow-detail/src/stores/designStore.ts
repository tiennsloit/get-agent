import { defineStore } from 'pinia';
import { vscode } from '@/utilities/vscode';
import designDocument from '@/pages/sample-blueprint.txt?raw';
import type {
    ExplorerResponse,
    ExplorerContext,
    ActionResult
} from '@/types/explorerTypes';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string | any;
    type?: 'analysis' | 'log' | 'thought' | 'loading' | 'action_result';
    id?: string;
    metadata?: any;
}

interface DesignState {
    // Chat state
    messages: ChatMessage[];
    isAnalyzing: boolean;

    // Blueprint state
    blueprint: string;
    isEditing: boolean;
    editableContent: string;

    // Explorer context
    explorerContext: ExplorerContext;

    // Message event handler
    messageHandler: ((event: MessageEvent) => void) | null;
}

export const useDesignStore = defineStore('design', {
    state: (): DesignState => ({
        messages: [],
        isAnalyzing: false,
        blueprint: '',
        isEditing: false,
        editableContent: designDocument,
        explorerContext: {
            isExploring: false,
            currentIteration: 0,
            previousResponse: null,
            implementationGoal: '',
            observations: [],
            maxIterations: 30
        },
        messageHandler: null
    }),

    actions: {
        /**
         * Initialize the store - load blueprint and set up message listener
         */
        initialize() {
            this.loadBlueprint();
            this.setupMessageListener();
        },

        /**
         * Clean up - remove message listener
         */
        cleanup() {
            this.removeMessageListener();
        },

        /**
         * Load blueprint with mock stream
         */
        loadBlueprint() {
            // Manually implement streaming effect for store state
            let index = 0;
            const interval = 100;
            const chunkSize = 50;

            const intervalId = setInterval(() => {
                if (index < designDocument.length) {
                    const chunk = designDocument.slice(index, index + chunkSize);
                    this.blueprint += chunk;
                    index += chunkSize;
                } else {
                    clearInterval(intervalId);
                }
            }, interval);
        },

        /**
         * Start editing mode
         */
        startEditing() {
            this.isEditing = true;
        },

        /**
         * Cancel editing and reset content
         */
        cancelEditing() {
            this.isEditing = false;
            this.editableContent = designDocument;
        },

        /**
         * Save changes to blueprint
         */
        saveChanges() {
            // TODO: Implement actual save functionality
            this.isEditing = false;
            // In a real implementation, you would save the content here
            console.log('Saving changes:', this.editableContent);
        },

        /**
         * Update editable content
         */
        updateEditableContent(content: string) {
            this.editableContent = content;
        },

        /**
         * Add a user message and send to extension
         */
        sendUserMessage(message: string, flowId: string = 'flow-123') {
            // Validate input
            if (!message || !message.trim()) {
                console.warn('Cannot send empty message');
                return;
            }

            if (this.isAnalyzing) {
                console.warn('Already analyzing, please wait');
                return;
            }

            // Add user message to chat
            this.addMessage({
                role: 'user',
                content: message.trim()
            });

            // Add loading message
            this.addLoadingMessage();

            // Show loading indicator
            this.isAnalyzing = true;

            // Send message to extension
            try {
                vscode.postMessage({
                    command: 'analyzeUserRequest',
                    data: {
                        flowId,
                        userRequest: message.trim()
                    }
                });
            } catch (error) {
                console.error('Failed to send message:', error);
                this.removeLoadingMessages();
                this.isAnalyzing = false;
                this.addMessage({
                    role: 'assistant',
                    type: 'log',
                    content: 'Failed to send message. Please try again.'
                });
            }
        },

        /**
         * Add a message to the chat
         */
        addMessage(message: ChatMessage) {
            this.messages.push(message);
        },

        /**
         * Add a loading message
         */
        addLoadingMessage() {
            const loadingMessageId = 'loading-' + Date.now();
            this.messages.push({
                role: 'assistant',
                type: 'loading',
                content: '',
                id: loadingMessageId
            });
        },

        /**
         * Remove loading messages
         */
        removeLoadingMessages() {
            this.messages = this.messages.filter(msg => msg.type !== 'loading');
        },

        /**
         * Handle analysis response from extension
         */
        handleAnalysisResponse(analysis: any) {
            // Remove loading message
            this.removeLoadingMessages();

            // Add analysis response
            this.addMessage({
                role: 'assistant',
                type: 'analysis',
                content: analysis
            });

            this.isAnalyzing = false;

            // Start exploration loop after analysis
            if (analysis?.core_requirement?.main_objective) {
                this.startExplorationLoop(analysis.core_requirement.main_objective);
            }
        },

        /**
         * Start the exploration loop
         */
        startExplorationLoop(implementationGoal: string, flowId: string = 'flow-123') {
            // Validate input
            if (!implementationGoal || !implementationGoal.trim()) {
                console.warn('Cannot start exploration with empty goal');
                return;
            }

            if (this.explorerContext.isExploring) {
                console.warn('Exploration already in progress');
                return;
            }

            this.explorerContext.isExploring = true;
            this.explorerContext.implementationGoal = implementationGoal.trim();
            this.explorerContext.currentIteration = 0;
            this.explorerContext.previousResponse = null;
            this.explorerContext.observations = [];

            // Start first iteration
            this.runExplorationIteration(flowId);
        },

        /**
         * Run a single exploration iteration
         */
        runExplorationIteration(flowId: string = 'flow-123') {
            if (!this.explorerContext.isExploring) {
                return;
            }

            // Check max iterations
            if (this.explorerContext.currentIteration >= this.explorerContext.maxIterations) {
                this.addMessage({
                    role: 'assistant',
                    type: 'log',
                    content: 'Maximum iterations reached. Stopping exploration.'
                });
                this.stopExploration();
                return;
            }

            // Add loading message
            this.addLoadingMessage();

            // Prepare previous observation
            const previousObservation = this.explorerContext.observations.length > 0
                ? this.explorerContext.observations[this.explorerContext.observations.length - 1]
                : undefined;

            // Send exploration request to extension
            try {
                let clonedData = JSON.parse(JSON.stringify({
                    flowId,
                    implementationGoal: this.explorerContext.implementationGoal,
                    previousResponse: this.explorerContext.previousResponse,
                    previousObservation
                }));
                vscode.postMessage({
                    command: 'exploreCode',
                    data: clonedData
                });
            } catch (error) {
                console.error('Failed to send exploration request:', error);
                this.handleExplorationError('Failed to send exploration request');
            }
        },

        /**
         * Handle explorer response from extension
         */
        handleExplorerResponse(response: ExplorerResponse, flowId: string = 'flow-123') {
            // Remove loading message
            this.removeLoadingMessages();

            // Update iteration count
            this.explorerContext.currentIteration = response.iteration;
            this.explorerContext.previousResponse = response;

            // Add thinking message with metadata
            this.addMessage({
                role: 'assistant',
                type: 'thought',
                content: response.thinking,
                metadata: {
                    explorerResponse: response
                }
            });

            // Check if we should continue exploring
            if (!response.continue_exploration) {
                this.addMessage({
                    role: 'assistant',
                    type: 'log',
                    content: `Exploration complete! Understanding level: ${response.understanding_level}%`
                });
                this.stopExploration();
                return;
            }

            // Execute the action
            this.executeAction(response.action, response.iteration, flowId);
        },

        /**
         * Execute an action from the explorer
         */
        executeAction(action: any, iteration: number, flowId: string = 'flow-123') {
            // Add log message about the action
            this.addMessage({
                role: 'assistant',
                type: 'log',
                content: `[Iteration ${iteration}] Executing action: ${action.type} - ${action.expected_insights}`
            });

            // Send action request to extension
            vscode.postMessage({
                command: 'performAction',
                data: {
                    flowId,
                    action,
                    iteration
                }
            });
        },

        /**
         * Handle action result from extension
         */
        handleActionResult(result: ActionResult, flowId: string = 'flow-123') {
            if (result.success) {
                // Store observation
                const observation = JSON.stringify(result.data, null, 2);
                this.explorerContext.observations.push(observation);

                // Add log message
                this.addMessage({
                    role: 'assistant',
                    type: 'log',
                    content: `Action completed successfully: ${result.actionType}`
                });
            } else {
                // Store error as observation
                const errorObservation = `Error executing ${result.actionType}: ${result.error}`;
                this.explorerContext.observations.push(errorObservation);

                // Add error log
                this.addMessage({
                    role: 'assistant',
                    type: 'log',
                    content: errorObservation
                });
            }

            // Continue to next iteration
            this.runExplorationIteration(flowId);
        },

        /**
         * Stop exploration loop
         */
        stopExploration() {
            this.explorerContext.isExploring = false;
            this.isAnalyzing = false;
        },

        /**
         * Handle exploration error
         */
        handleExplorationError(error: string) {
            this.removeLoadingMessages();
            this.addMessage({
                role: 'assistant',
                type: 'log',
                content: `Exploration error: ${error}`
            });
            this.stopExploration();
        },

        /**
         * Set up message listener for extension communication
         */
        setupMessageListener() {
            // Create the handler function
            this.messageHandler = (event: MessageEvent) => {
                const message = event.data;
                switch (message.command) {
                    case 'analyzeUserResponse':
                        this.handleAnalysisResponse(message.data.analysis);
                        break;
                    case 'explorerResponse':
                        this.handleExplorerResponse(message.data.response);
                        break;
                    case 'actionResult':
                        this.handleActionResult(message.data.result);
                        break;
                    case 'explorationError':
                        this.handleExplorationError(message.data.error);
                        break;
                }
            };

            // Add event listener
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
        },

        /**
         * Clear all messages
         */
        clearMessages() {
            this.messages = [];
            this.isAnalyzing = false;
        },

        /**
         * Reset store to initial state
         */
        reset() {
            this.messages = [];
            this.isAnalyzing = false;
            this.blueprint = '';
            this.isEditing = false;
            this.editableContent = designDocument;
            this.explorerContext = {
                isExploring: false,
                currentIteration: 0,
                previousResponse: null,
                implementationGoal: '',
                observations: [],
                maxIterations: 30
            };
        }
    }
});
