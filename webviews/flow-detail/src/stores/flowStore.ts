import { defineStore } from 'pinia';
import type { Flow } from '../../../../shared/models/flow';

export const useFlowStore = defineStore('flow', {
  state: () => ({
    currentStep: 1,
    currentFlow: null as Flow | null,
    messageHandler: null as ((event: MessageEvent) => void) | null,
  }),
  
  actions: {
    setCurrentStep(step: number) {
      if (step >= 1 && step <= 3) {
        this.currentStep = step;
        console.log('[FlowStore] Current step set to:', step);
      }
    },
    
    nextStep() {
      if (this.currentStep < 3) {
        this.currentStep++;
      }
    },
    
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },

    /**
     * Initialize message listener for flow data updates
     */
    initialize() {
      this.setupMessageListener();
    },

    /**
     * Clean up message listener
     */
    cleanup() {
      this.removeMessageListener();
    },

    /**
     * Set up message listener for extension communication
     */
    setupMessageListener() {
      this.messageHandler = (event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'flowDataUpdate') {
          this.handleFlowDataUpdate(message.data);
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
    },

    /**
     * Handle flow data update from extension
     */
    handleFlowDataUpdate(data: any) {
      console.log('[FlowStore] Received flow data update', data);

      // Store current flow data
      if (data.flow) {
        this.currentFlow = data.flow;
      }

      // Update current step based on extension data
      if (data.currentStep !== undefined) {
        this.setCurrentStep(data.currentStep);
      }
    }
  },
  
  persist: true
});