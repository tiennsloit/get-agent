/**
 * Flow store for managing flow state in the sidebar
 */

import { defineStore } from 'pinia';
import { type FlowListItem, type Flow, type CreateFlowRequest, FlowState as FlowItemState } from '@/types/flow';
import { vscode } from '@/utilities/vscode';
import { OutputCommands } from '@/constants/commands';

interface FlowState {
  flows: FlowListItem[];
  currentFlow: Flow | null;
  isLoading: boolean;
  searchQuery: string;
}

export const useFlowStore = defineStore('flow', {
  state: (): FlowState => ({
    flows: [],
    currentFlow: null,
    isLoading: false,
    searchQuery: ''
  }),

  getters: {
    inProgressFlows: (state) => {
      const inProgressStates = [FlowItemState.DESIGNING, FlowItemState.EXECUTING, FlowItemState.PAUSED, FlowItemState.TODO] as FlowItemState[];
      return state.flows
        .filter(flow => inProgressStates.includes(flow.state))
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    },

    completedFlows: (state) => {
      const completedStates = [FlowItemState.COMPLETED, FlowItemState.CANCELLED] as FlowItemState[];
      return state.flows
        .filter(flow => completedStates.includes(flow.state))
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    },

    filteredFlows: (state) => {
      if (!state.searchQuery.trim()) {
        return state.flows;
      }

      const query = state.searchQuery.toLowerCase();
      return state.flows.filter(flow =>
        flow.title.toLowerCase().includes(query)
      );
    },

    todoFlows: (state) => {
      return state.flows
        .filter(flow => flow.state === FlowItemState.TODO)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }
  },

  actions: {
    /**
     * Set the list of flows
     */
    setFlows(flows: FlowListItem[]): void {
      this.flows = flows;
    },

    /**
     * Add a new flow to the list
     */
    addFlow(flow: FlowListItem): void {
      this.flows.unshift(flow);
    },

    /**
     * Update an existing flow in the list
     */
    updateFlow(flowId: string, updates: Partial<FlowListItem>): void {
      const index = this.flows.findIndex(f => f.id === flowId);
      if (index !== -1) {
        this.flows[index] = { ...this.flows[index], ...updates };
      }
    },

    /**
     * Remove a flow from the list
     */
    removeFlow(flowId: string): void {
      const index = this.flows.findIndex(f => f.id === flowId);
      if (index !== -1) {
        this.flows.splice(index, 1);
      }
    },

    /**
     * Set the current flow details
     */
    setCurrentFlow(flow: Flow | null): void {
      this.currentFlow = flow;
    },

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading;
    },

    /**
     * Set search query
     */
    setSearchQuery(query: string): void {
      this.searchQuery = query;
    },

    /**
     * Create a new flow
     */
    async createFlow(request: CreateFlowRequest): Promise<string | null> {
      this.setLoading(true);
      try {
        vscode.postMessage({
          command: OutputCommands.CREATE_FLOW,
          data: request
        });
        return null; // Will be handled by message response
      } catch (error) {
        console.error('Failed to create flow:', error);
        return null;
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Delete a flow
     */
    async deleteFlow(flowId: string): Promise<void> {
      this.setLoading(true);
      try {
        vscode.postMessage({
          command: OutputCommands.DELETE_FLOW,
          data: { flowId }
        });
      } catch (error) {
        console.error('Failed to delete flow:', error);
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Search flows
     */
    async searchFlows(query: string): Promise<void> {
      this.setLoading(true);
      try {
        vscode.postMessage({
          command: OutputCommands.SEARCH_FLOWS,
          data: { query }
        });
      } catch (error) {
        console.error('Failed to search flows:', error);
      } finally {
        this.setLoading(false);
      }
    },

    /**
     * Refresh flows list
     */
    async refreshFlows(): Promise<void> {
      this.setLoading(true);
      try {
        vscode.postMessage({
          command: OutputCommands.GET_FLOWS
        });
      } catch (error) {
        console.error('Failed to refresh flows:', error);
      } finally {
        this.setLoading(false);
      }
    }
  }
});