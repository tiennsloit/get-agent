import { defineStore } from 'pinia';
import { vscode } from '@/utilities/vscode';
import type {
    ExplorerResponse,
    ExplorerContext,
    ActionResult,
    ExplorationHistory,
    CumulativeKnowledge
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
    blueprintGenerating: boolean;
    blueprintReady: boolean;

    // Explorer context
    explorerContext: ExplorerContext;

    // Enhanced exploration state
    explorationHistory: ExplorationHistory[];
    cumulativeKnowledge: CumulativeKnowledge;
    exploredTargets: Set<string>;

    // Analysis context storage
    analysisContext: any | null;

    // Message event handler
    messageHandler: ((event: MessageEvent) => void) | null;
}

export const useDesignStore = defineStore('design', {
    state: (): DesignState => ({
        messages: [],
        isAnalyzing: false,
        blueprint: '',
        isEditing: false,
        editableContent: '',
        blueprintGenerating: false,
        blueprintReady: false,
        explorerContext: {
            isExploring: false,
            currentIteration: 0,
            previousResponse: null,
            implementationGoal: '',
            observations: [],
            maxIterations: 50
        },
        explorationHistory: [],
        cumulativeKnowledge: {
            confirmed: [],
            assumptions: [],
            unknowns: [],
            explored_files: [],
            explored_directories: []
        },
        exploredTargets: new Set<string>(),
        analysisContext: null,
        messageHandler: null
    }),

    actions: {
        /**
         * Aggregate knowledge from current response into cumulative knowledge
         */
        aggregateKnowledge(response: ExplorerResponse) {
            const currentKnowledge = response.current_knowledge;

            // Merge confirmed facts (deduplicate)
            const confirmedSet = new Set([...this.cumulativeKnowledge.confirmed, ...(currentKnowledge.confirmed || [])]);
            this.cumulativeKnowledge.confirmed = Array.from(confirmedSet);

            // Merge assumptions (deduplicate)
            const assumptionsSet = new Set([...this.cumulativeKnowledge.assumptions, ...(currentKnowledge.assumptions || [])]);
            this.cumulativeKnowledge.assumptions = Array.from(assumptionsSet);

            // Update unknowns (replace with current)
            this.cumulativeKnowledge.unknowns = [...(currentKnowledge.unknowns || [])];

            // Merge explored files and directories from response if available
            if (currentKnowledge.explored_files) {
                const exploredFilesSet = new Set([...this.cumulativeKnowledge.explored_files, ...currentKnowledge.explored_files]);
                this.cumulativeKnowledge.explored_files = Array.from(exploredFilesSet);
            }

            if (currentKnowledge.explored_directories) {
                const exploredDirsSet = new Set([...this.cumulativeKnowledge.explored_directories, ...currentKnowledge.explored_directories]);
                this.cumulativeKnowledge.explored_directories = Array.from(exploredDirsSet);
            }
        },

        /**
         * Extract key findings from response thinking
         */
        extractKeyFindings(response: ExplorerResponse): string[] {
            // Simple extraction: split thinking into sentences and take first 3 meaningful ones
            const sentences = response.thinking.split(/[.!?]\s+/).filter(s => s.trim().length > 20);
            return sentences.slice(0, 3);
        },

        /**
         * Initialize the store - set up message listener
         */
        initialize() {
            this.setupMessageListener();
        },

        /**
         * Clean up - remove message listener
         */
        cleanup() {
            this.removeMessageListener();
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

            // Store analysis context for later use in blueprint generation
            this.analysisContext = analysis;

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

            // Reset enhanced exploration state
            this.explorationHistory = [];
            this.cumulativeKnowledge = {
                confirmed: [],
                assumptions: [],
                unknowns: [],
                explored_files: [],
                explored_directories: []
            };
            this.exploredTargets = new Set<string>();

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

            // Prepare previous observation for backward compatibility
            const previousObservation = this.explorerContext.observations.length > 0
                ? this.explorerContext.observations[this.explorerContext.observations.length - 1]
                : undefined;

            // Send exploration request to extension with new format
            // Use 'history' field instead of 'explorationHistory' (while keeping legacy for now)
            try {
                let clonedData = JSON.parse(JSON.stringify({
                    flowId,
                    implementationGoal: this.explorerContext.implementationGoal,
                    // New format: use 'history' field with observations embedded
                    history: this.explorationHistory,
                    cumulativeKnowledge: this.cumulativeKnowledge,
                    // Legacy fields for backward compatibility (can be removed in future)
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

            // Aggregate cumulative knowledge
            this.aggregateKnowledge(response);

            // Extract key findings
            const keyFindings = this.extractKeyFindings(response);

            // Track explored files and directories from action
            const exploredFiles: string[] = [];
            const exploredDirectories: string[] = [];

            if (response.action.type === 'read_file' && response.action.parameters.path) {
                exploredFiles.push(response.action.parameters.path);
                this.exploredTargets.add(response.action.parameters.path);
            } else if (response.action.type === 'list_directory' && response.action.parameters.path) {
                exploredDirectories.push(response.action.parameters.path);
                this.exploredTargets.add(response.action.parameters.path);
            }

            // Create action summary
            const actionSummary = {
                type: response.action.type,
                target: response.action.parameters.path || response.action.parameters.query || response.action.parameters.command || 'unknown',
                success: true // Will be updated when action result comes back
            };

            // Create history entry
            const historyEntry: ExplorationHistory = {
                iteration: response.iteration,
                understanding_level: response.understanding_level,
                action_summary: actionSummary,
                key_findings: keyFindings,
                explored_files: exploredFiles,
                explored_directories: exploredDirectories
            };

            // Store in history (will be completed with actual success status after action execution)
            this.explorationHistory.push(historyEntry);

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
                    content: `Exploration complete! Understanding level: ${(response.understanding_level * 100).toFixed(0)}%`
                });

                // Check if understanding level is sufficient for blueprint generation
                if (response.understanding_level >= 0.7) {
                    this.addMessage({
                        role: 'assistant',
                        type: 'log',
                        content: 'Starting blueprint generation...'
                    });
                    this.requestBlueprintGeneration(flowId);
                } else {
                    this.addMessage({
                        role: 'assistant',
                        type: 'log',
                        content: 'Understanding level too low for blueprint generation. Manual intervention required.'
                    });
                }

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
                // Store observation in the last history entry
                if (this.explorationHistory.length > 0) {
                    const lastEntry = this.explorationHistory[this.explorationHistory.length - 1];
                    lastEntry.observation = result.data; // Attach observation to history entry
                    lastEntry.action_summary.success = true; // Update success status
                }

                // Also keep in observations array for backward compatibility
                const observation = JSON.stringify(result.data, null, 2);
                this.explorerContext.observations.push(observation);

                // Add log message
                this.addMessage({
                    role: 'assistant',
                    type: 'log',
                    content: `Action completed successfully: ${result.actionType}`
                });
            } else {
                // Store error as observation in history
                if (this.explorationHistory.length > 0) {
                    const lastEntry = this.explorationHistory[this.explorationHistory.length - 1];
                    lastEntry.observation = { error: result.error };
                    lastEntry.action_summary.success = false; // Update success status
                }

                // Store error as observation for backward compatibility
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
         * Request blueprint generation from extension
         */
        requestBlueprintGeneration(flowId: string = 'flow-123') {
            this.blueprintGenerating = true;
            this.blueprint = ''; // Clear any existing blueprint
            const clonedData = JSON.parse(JSON.stringify({
                flowId,
                implementationGoal: this.explorerContext.implementationGoal,
                explorationHistory: this.explorationHistory,
                cumulativeKnowledge: this.cumulativeKnowledge,
                analysisContext: this.analysisContext
            }));

            vscode.postMessage({
                command: 'generateBlueprintFromExploration',
                data: clonedData,
            });
        },

        /**
         * Handle blueprint chunk from extension
         */
        handleBlueprintChunk(chunk: string) {
            this.blueprint += chunk;
        },

        /**
         * Handle blueprint generation complete
         */
        handleBlueprintComplete() {
            this.blueprintGenerating = false;
            this.blueprintReady = true;
            this.addMessage({
                role: 'assistant',
                type: 'log',
                content: 'Blueprint generation complete!'
            });
        },

        /**
         * Handle blueprint generation error
         */
        handleBlueprintError(error: string) {
            this.blueprintGenerating = false;
            this.addMessage({
                role: 'assistant',
                type: 'log',
                content: `Blueprint generation error: ${error}`
            });
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
                    case 'blueprintChunk':
                        this.handleBlueprintChunk(message.data.chunk);
                        break;
                    case 'blueprintComplete':
                        this.handleBlueprintComplete();
                        break;
                    case 'blueprintError':
                        this.handleBlueprintError(message.data.error);
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
            this.editableContent = '';
            this.blueprintGenerating = false;
            this.blueprintReady = false;
            this.explorerContext = {
                isExploring: false,
                currentIteration: 0,
                previousResponse: null,
                implementationGoal: '',
                observations: [],
                maxIterations: 50
            };
            this.explorationHistory = [];
            this.cumulativeKnowledge = {
                confirmed: [],
                assumptions: [],
                unknowns: [],
                explored_files: [],
                explored_directories: []
            };
            this.exploredTargets = new Set<string>();
            this.analysisContext = null;
        }
    }
});
