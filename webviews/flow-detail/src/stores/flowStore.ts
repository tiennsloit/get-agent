import { defineStore } from 'pinia';
import type { Flow } from '../../../../shared/models/flow';
import { FlowState } from '../../../../shared/models/flow';

export const useFlowStore = defineStore('flow', {
  state: () => ({
    currentStep: 1,
    currentFlow: null as Flow | null,
    messageHandler: null as ((event: MessageEvent) => void) | null,
  }),
  
  getters: {
    /**
     * Get the maximum available step based on flow state
     * Step 1 (Design): Always available for to-do, designing states
     * Step 2 (Execute): Available when executing or paused
     * Step 3 (Report): Available when reporting, completed, or cancelled
     */
    maxAvailableStep(): number {
      if (!this.currentFlow) {
        return 1;
      }

      const state = this.currentFlow.state;
      
      if (state === FlowState.REPORTING || 
          state === FlowState.COMPLETED || 
          state === FlowState.CANCELLED) {
        return 3; // All steps available
      }
      
      if (state === FlowState.EXECUTING || 
          state === FlowState.PAUSED) {
        return 2; // Design and Execute available
      }
      
      // TODO or DESIGNING states
      return 1; // Only Design available
    },

    /**
     * Get the current step based on flow state
     * This determines which page should be shown by default
     */
    stepForFlowState(): number {
      if (!this.currentFlow) {
        return 1;
      }

      const state = this.currentFlow.state;
      
      if (state === FlowState.REPORTING || 
          state === FlowState.COMPLETED || 
          state === FlowState.CANCELLED) {
        return 3; // Report page
      }
      
      if (state === FlowState.EXECUTING || 
          state === FlowState.PAUSED) {
        return 2; // Execute page
      }
      
      // TODO or DESIGNING states
      return 1; // Design page
    }
  },
  
  actions: {
    setCurrentStep(step: number) {
      // Only allow navigation to steps that are available based on flow state
      const maxStep = this.maxAvailableStep;
      
      if (step >= 1 && step <= maxStep) {
        this.currentStep = step;
        console.log('[FlowStore] Current step set to:', step, '(max available:', maxStep, ')');
      } else {
        console.warn('[FlowStore] Cannot navigate to step', step, '- max available step is', maxStep);
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
     * Note: Does NOT reset state to allow navigation between steps
     */
    cleanup() {
      console.log('[FlowStore] Cleanup called - removing message listener only');
      // Only remove message listener, keep state intact for navigation
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

      // Update current step based on flow state (not extension data)
      // The extension may send currentStep, but we should derive it from flow.state
      const targetStep = this.stepForFlowState;
      this.setCurrentStep(targetStep);
    }
  },
  
  persist: true
});