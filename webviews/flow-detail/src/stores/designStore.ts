import { defineStore } from 'pinia';
import { vscode } from '@/utilities/vscode';
import type {
    ExplorerResponse,
    ExplorerContext,
    ActionResult,
    ExplorationHistory,
    CumulativeKnowledge
} from '@/types/explorerTypes';
import { useFlowStore } from './flowStore';

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
         * Get current flow ID from flow store
         */
        getCurrentFlowId(): string {
            const flowStore = useFlowStore();
            return flowStore.currentFlow?.id || 'flow-123';
        },

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
            console.log('[DesignStore] Initializing - setting up message listener');
            this.setupMessageListener();
            // Request initial flow data from extension after listener is ready
            console.log('[DesignStore] Requesting flow data');
            vscode.postMessage({
                command: 'getFlowData'
            });
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
        sendUserMessage(message: string, flowId: string = 'flow-123', currentFlowState?: string) {
            // Validate input
            if (!message || !message.trim()) {
                console.warn('Cannot send empty message');
                return;
            }

            if (this.isAnalyzing) {
                console.warn('Already analyzing, please wait');
                return;
            }

            // Check if this is the first user message and flow is in TODO state
            const isFirstUserMessage = this.messages.filter(msg => msg.role === 'user').length === 0;
            if (isFirstUserMessage && currentFlowState === 'to-do') {
                console.log('[DesignStore] First user message detected, transitioning flow state to DESIGNING');
                // Send state transition command before analysis
                vscode.postMessage({
                    command: 'updateFlowState',
                    data: {
                        state: 'designing'
                    }
                });
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

            // Sync analysis context to extension storage
            this.syncDesignData(this.getCurrentFlowId());

            // Start exploration loop after analysis
            if (analysis?.core_requirement?.main_objective) {
                this.startExplorationLoop(analysis.core_requirement.main_objective);
            }
        },

        /**
         * Start the exploration loop
         */
        startExplorationLoop(implementationGoal: string, flowId?: string) {
            const actualFlowId = flowId || this.getCurrentFlowId();
            
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
            this.runExplorationIteration(actualFlowId);
        },

        /**
         * Run a single exploration iteration
         */
        runExplorationIteration(flowId?: string) {
            const actualFlowId = flowId || this.getCurrentFlowId();
            
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
                    flowId: actualFlowId,
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
        handleExplorerResponse(response: ExplorerResponse, flowId?: string) {
            const actualFlowId = flowId || this.getCurrentFlowId();
            
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

            // Type-safe parameter extraction based on action type
            let target = 'unknown';
            if (response.action.type === 'read_file') {
                const params = response.action.parameters as { path: string };
                if (params.path) {
                    exploredFiles.push(params.path);
                    this.exploredTargets.add(params.path);
                    target = params.path;
                }
            } else if (response.action.type === 'list_directory') {
                const params = response.action.parameters as { path: string; recursive?: boolean };
                if (params.path) {
                    exploredDirectories.push(params.path);
                    this.exploredTargets.add(params.path);
                    target = params.path;
                }
            } else if (response.action.type === 'search_content') {
                const params = response.action.parameters as { query: string; scope?: string };
                target = params.query;
            } else if (response.action.type === 'read_terminal') {
                const params = response.action.parameters as { command: string };
                target = params.command;
            }

            // Create action summary
            const actionSummary = {
                type: response.action.type,
                target,
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
                    this.requestBlueprintGeneration(actualFlowId);
                } else {
                    this.addMessage({
                        role: 'assistant',
                        type: 'log',
                        content: 'Understanding level too low for blueprint generation. Manual intervention required.'
                    });
                }

                // Sync messages and exploration history to extension storage
                this.syncDesignData(actualFlowId);

                this.stopExploration();
                return;
            }

            // Execute the action
            this.executeAction(response.action, response.iteration, actualFlowId);
        },

        /**
         * Execute an action from the explorer
         */
        executeAction(action: any, iteration: number, flowId?: string) {
            const actualFlowId = flowId || this.getCurrentFlowId();
            
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
                    flowId: actualFlowId,
                    action,
                    iteration
                }
            });
        },

        /**
         * Handle action result from extension
         */
        handleActionResult(result: ActionResult, flowId?: string) {
            const actualFlowId = flowId || this.getCurrentFlowId();
            
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

            // Save exploration progress after each action
            this.syncDesignData(actualFlowId);

            // Continue to next iteration
            this.runExplorationIteration(actualFlowId);
        },

        /**
         * Request blueprint generation from extension
         */
        requestBlueprintGeneration(flowId?: string) {
            const actualFlowId = flowId || this.getCurrentFlowId();
            
            this.blueprintGenerating = true;
            this.blueprint = ''; // Clear any existing blueprint
            const clonedData = JSON.parse(JSON.stringify({
                flowId: actualFlowId,
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
            this.editableContent = this.blueprint;
            this.addMessage({
                role: 'assistant',
                type: 'log',
                content: 'Blueprint generation complete!'
            });

            // Sync blueprint to extension storage
            this.syncDesignData(this.getCurrentFlowId());
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
            console.log('[DesignStore] Setting up message listener');
            // Create the handler function
            this.messageHandler = (event: MessageEvent) => {
                const message = event.data;
                console.log('[DesignStore] Received message:', message.command);
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
                    case 'flowDataUpdate':
                        this.handleFlowDataUpdate(message.data);
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
        },

        /**
         * Sync design data to extension storage (throttled)
         */
        syncDesignData(flowId: string = 'flow-123') {
            const updates: any = {};

            // Include blueprint if ready
            if (this.blueprintReady && this.blueprint) {
                updates.blueprint = this.blueprint;
            }

            // Include messages if any exist
            if (this.messages.length > 0) {
                updates.messages = this.messages;
            }

            // Include analysis context if available
            if (this.analysisContext) {
                updates.analysisContext = this.analysisContext;
            }

            // Include exploration history if exists
            if (this.explorationHistory.length > 0) {
                updates.explorationHistory = this.explorationHistory;
            }

            // Include cumulative knowledge if exists
            if (this.cumulativeKnowledge.confirmed.length > 0 || 
                this.cumulativeKnowledge.assumptions.length > 0 || 
                this.cumulativeKnowledge.unknowns.length > 0) {
                updates.cumulativeKnowledge = this.cumulativeKnowledge;
            }

            // Include explorer context if exploring or has data
            if (this.explorerContext.implementationGoal || this.explorerContext.observations.length > 0) {
                updates.explorerContext = this.explorerContext;
            }

            // Only send if there's something to update
            if (Object.keys(updates).length === 0) {
                return;
            }

            console.log('[DesignStore] Syncing design data to extension', {
                hasBlueprint: !!updates.blueprint,
                messageCount: updates.messages?.length ?? 0,
                hasAnalysisContext: !!updates.analysisContext,
                explorationHistoryCount: updates.explorationHistory?.length ?? 0,
                hasKnowledge: !!updates.cumulativeKnowledge,
                hasExplorerContext: !!updates.explorerContext
            });

            vscode.postMessage({
                command: 'saveDesignData',
                data: {
                    flowId,
                    updates: JSON.parse(JSON.stringify(updates))
                }
            });
        },

        /**
         * Restore design data from flow object
         */
        restoreFromFlowData(designData: any) {
            if (!designData) {
                console.log('[DesignStore] No design data to restore');
                return;
            }

            console.log('[DesignStore] Restoring design data', {
                hasBlueprint: !!designData.blueprint,
                messageCount: designData.messages?.length ?? 0,
                hasAnalysisContext: !!designData.analysisContext,
                explorationHistoryCount: designData.explorationHistory?.length ?? 0,
                hasKnowledge: !!designData.cumulativeKnowledge,
                hasExplorerContext: !!designData.explorerContext
            });

            try {
                // Restore blueprint with validation
                if (designData.blueprint && typeof designData.blueprint === 'string') {
                    this.blueprint = designData.blueprint;
                    this.blueprintReady = true;
                    console.log('[DesignStore] Blueprint restored successfully');
                }

                // Restore messages with validation
                if (designData.messages && Array.isArray(designData.messages)) {
                    this.messages = designData.messages;
                    console.log(`[DesignStore] Restored ${designData.messages.length} messages`);
                }

                // Restore analysis context with validation
                if (designData.analysisContext) {
                    this.analysisContext = designData.analysisContext;
                    console.log('[DesignStore] Analysis context restored');
                }

                // Restore exploration history with validation
                if (designData.explorationHistory && Array.isArray(designData.explorationHistory)) {
                    this.explorationHistory = designData.explorationHistory;
                    console.log(`[DesignStore] Restored ${designData.explorationHistory.length} exploration iterations`);
                }

                // Restore cumulative knowledge with validation
                if (designData.cumulativeKnowledge) {
                    this.cumulativeKnowledge = designData.cumulativeKnowledge;
                    console.log('[DesignStore] Cumulative knowledge restored', {
                        confirmedCount: this.cumulativeKnowledge.confirmed.length,
                        assumptionsCount: this.cumulativeKnowledge.assumptions.length,
                        unknownsCount: this.cumulativeKnowledge.unknowns.length
                    });
                }

                // Restore explorer context with validation
                if (designData.explorerContext) {
                    // Restore explorer context but mark exploration as NOT active
                    this.explorerContext = {
                        ...designData.explorerContext,
                        isExploring: false // Never restore as active
                    };
                    console.log('[DesignStore] Explorer context restored', {
                        implementationGoal: this.explorerContext.implementationGoal,
                        iterations: this.explorerContext.currentIteration
                    });
                }

                console.log('[DesignStore] Design data restoration complete');
            } catch (error) {
                console.error('[DesignStore] Error restoring design data:', error);
                // Don't crash the application - gracefully handle errors
            }
        },

        /**
         * Handle flow data update from extension
         */
        handleFlowDataUpdate(data: any) {
            console.log('[DesignStore] Received flow data update', {
                hasFlow: !!data.flow,
                flowId: data.flow?.id,
                flowState: data.flow?.state,
                hasDesignData: !!data.flow?.designData
            });

            // Validate that we received flow data
            if (!data.flow) {
                console.warn('[DesignStore] No flow data in update message');
                return;
            }

            // Restore design data if available
            if (data.flow.designData) {
                console.log('[DesignStore] Design data found, restoring...');
                this.restoreFromFlowData(data.flow.designData);
            } else {
                console.log('[DesignStore] No design data to restore');
            }
        }
    }
});
