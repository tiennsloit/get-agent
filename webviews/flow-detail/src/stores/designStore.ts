import { defineStore } from 'pinia';
import { vscode } from '@/utilities/vscode';
import designDocument from '@/pages/sample-blueprint.txt?raw';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string | any;
    type?: 'analysis' | 'log' | 'thought' | 'loading';
    id?: string;
}

interface DesignState {
    // Chat state
    messages: ChatMessage[];
    isAnalyzing: boolean;

    // Blueprint state
    blueprint: string;
    isEditing: boolean;
    editableContent: string;

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
            if (!message || this.isAnalyzing) { return; }

            // Add user message to chat
            this.addMessage({
                role: 'user',
                content: message
            });

            // Add loading message
            this.addLoadingMessage();

            // Show loading indicator
            this.isAnalyzing = true;

            // Send message to extension
            vscode.postMessage({
                command: 'analyzeUserRequest',
                data: {
                    flowId,
                    userRequest: message
                }
            });
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
        }
    }
});
