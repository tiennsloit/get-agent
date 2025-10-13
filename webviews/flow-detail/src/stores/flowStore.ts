import { defineStore } from 'pinia';

export const useFlowStore = defineStore('flow', {
  state: () => ({
    currentStep: 1, // 1: Design, 2: Execute, 3: Report
  }),
  
  actions: {
    setCurrentStep(step: number) {
      if (step >= 1 && step <= 3) {
        this.currentStep = step;
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
    }
  },
  
  persist: true
});