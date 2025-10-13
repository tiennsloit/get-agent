/**
 * Flow execution engine for processing flow steps
 */

import * as vscode from 'vscode';
import type { Task, ExecutionReport } from '../../types/flowState';
import { FlowState } from '../../types/flowState';
import type { ExecutionStep, StepExecutionResult, StepType } from '../../types/stepTypes';
import { FlowStateManager } from './flowStateManager';

export class FlowExecutor {
  private flowStateManager: FlowStateManager;
  private isExecuting: boolean = false;
  private currentFlowId: string | null = null;

  constructor(flowStateManager: FlowStateManager) {
    this.flowStateManager = flowStateManager;
  }

  /**
   * Start executing a flow
   */
  public async executeFlow(flowId: string): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Another flow is currently executing');
    }

    const flow = this.flowStateManager.getFlow(flowId);
    if (!flow) {
      throw new Error('Flow not found');
    }

    if (flow.state !== FlowState.DESIGNING && flow.state !== FlowState.PAUSED) {
      throw new Error('Flow cannot be executed in current state');
    }

    this.isExecuting = true;
    this.currentFlowId = flowId;

    try {
      this.flowStateManager.updateFlowState(flowId, FlowState.EXECUTING);
      
      const report: ExecutionReport = {
        filesCreated: [],
        filesModified: [],
        filesDeleted: [],
        commandsExecuted: [],
        status: 'completed',
        summary: '',
        errors: []
      };

      // Execute each task in sequence
      for (let i = 0; i < flow.tasks.length; i++) {
        const task = flow.tasks[i];
        
        if (flow.state === FlowState.PAUSED) {
          break;
        }

        await this.executeTask(task, report);
        this.flowStateManager.updateFlowProgress(flowId, i + 1);
      }

      // Complete the flow if not paused
      if (flow.state !== FlowState.PAUSED) {
        report.summary = `Flow completed successfully. ${report.filesCreated.length} files created, ${report.filesModified.length} files modified, ${report.commandsExecuted.length} commands executed.`;
        this.flowStateManager.setFlowExecutionReport(flowId, report);
        this.flowStateManager.updateFlowState(flowId, FlowState.COMPLETED);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const report: ExecutionReport = {
        filesCreated: [],
        filesModified: [],
        filesDeleted: [],
        commandsExecuted: [],
        status: 'failed',
        summary: `Flow execution failed: ${errorMessage}`,
        errors: [errorMessage]
      };
      
      this.flowStateManager.setFlowExecutionReport(flowId, report);
      this.flowStateManager.updateFlowState(flowId, FlowState.CANCELLED);
      throw error;
    } finally {
      this.isExecuting = false;
      this.currentFlowId = null;
    }
  }

  /**
   * Pause the currently executing flow
   */
  public pauseFlow(): void {
    if (this.isExecuting && this.currentFlowId) {
      this.flowStateManager.updateFlowState(this.currentFlowId, FlowState.PAUSED);
    }
  }

  /**
   * Stop the currently executing flow
   */
  public stopFlow(): void {
    if (this.isExecuting && this.currentFlowId) {
      this.flowStateManager.updateFlowState(this.currentFlowId, FlowState.CANCELLED);
      this.isExecuting = false;
      this.currentFlowId = null;
    }
  }

  /**
   * Check if executor is currently running
   */
  public get isRunning(): boolean {
    return this.isExecuting;
  }

  /**
   * Get currently executing flow ID
   */
  public get currentFlow(): string | null {
    return this.currentFlowId;
  }

  /**
   * Execute a single task (placeholder implementation)
   */
  private async executeTask(task: Task, report: ExecutionReport): Promise<void> {
    // Mark task as in progress
    task.status = 'in-progress';
    
    try {
      // TODO: Implement actual task execution logic
      // This would involve converting tasks to execution steps
      // and executing them using executeStep method
      
      // For now, simulate task execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate file operations based on task files
      for (const file of task.files) {
        switch (file.action) {
          case 'add':
            report.filesCreated.push(file.file);
            break;
          case 'edit':
            report.filesModified.push(file.file);
            break;
          case 'remove':
            report.filesDeleted.push(file.file);
            break;
        }
      }
      
      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      throw error;
    }
  }

  /**
   * Execute a single step (to be implemented with actual logic)
   */
  private async executeStep(step: ExecutionStep): Promise<StepExecutionResult> {
    try {
      switch (step.type) {
        case 'command':
          return await this.executeCommand(step);
        case 'file_add':
          return await this.createFile(step);
        case 'file_edit':
          return await this.editFile(step);
        case 'file_remove':
          return await this.removeFile(step);
        case 'text':
          return { success: true, summary: 'Information displayed' };
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        summary: `Failed to execute step: ${errorMessage}`,
        error: errorMessage
      };
    }
  }

  /**
   * Execute a terminal command
   */
  private async executeCommand(step: ExecutionStep): Promise<StepExecutionResult> {
    const commandData = step.data as any;
    const command = commandData.command || commandData.value;
    
    try {
      // Get or create terminal
      const terminal = vscode.window.createTerminal({
        name: 'Flow Execution',
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      });
      
      // Show terminal and execute command
      terminal.show();
      terminal.sendText(command);
      
      // For now, assume command succeeds
      // TODO: Implement proper command execution monitoring
      return { 
        success: true, 
        summary: `Executed command: ${command}` 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        summary: `Failed to execute command: ${command}`,
        error: errorMessage
      };
    }
  }

  /**
   * Create a new file
   */
  private async createFile(step: ExecutionStep): Promise<StepExecutionResult> {
    const fileData = step.data as any;
    const filePath = fileData.path || fileData.target;
    const content = fileData.content || fileData.value;
    
    try {
      // Resolve file path relative to workspace
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder found');
      }
      
      const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
      
      // Create file content
      const fileContent = Buffer.from(content, 'utf8');
      await vscode.workspace.fs.writeFile(fullPath, fileContent);
      
      return { 
        success: true, 
        summary: `Created file: ${filePath} (${fileContent.length} bytes)` 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        summary: `Failed to create file: ${filePath}`,
        error: errorMessage
      };
    }
  }

  /**
   * Edit an existing file
   */
  private async editFile(step: ExecutionStep): Promise<StepExecutionResult> {
    const fileData = step.data as any;
    const filePath = fileData.path || fileData.target;
    const newContent = fileData.newContent || fileData.value;
    const range = fileData.range;
    
    try {
      // Resolve file path relative to workspace
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder found');
      }
      
      const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
      
      // Open document
      const document = await vscode.workspace.openTextDocument(fullPath);
      
      // Create edit
      const edit = new vscode.WorkspaceEdit();
      
      if (range) {
        // Edit specific range
        const startPos = new vscode.Position(range.start - 1, 0); // Convert to 0-based
        const endPos = new vscode.Position(range.end - 1, document.lineAt(range.end - 1).text.length);
        const editRange = new vscode.Range(startPos, endPos);
        edit.replace(fullPath, editRange, newContent);
      } else {
        // Replace entire file content
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        edit.replace(fullPath, fullRange, newContent);
      }
      
      // Apply edit
      await vscode.workspace.applyEdit(edit);
      
      return { 
        success: true, 
        summary: `Modified file: ${filePath}${range ? ` (lines ${range.start}-${range.end})` : ''}` 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        summary: `Failed to edit file: ${filePath}`,
        error: errorMessage
      };
    }
  }

  /**
   * Remove a file
   */
  private async removeFile(step: ExecutionStep): Promise<StepExecutionResult> {
    const fileData = step.data as any;
    const filePath = fileData.path || fileData.target;
    
    try {
      // Resolve file path relative to workspace
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder found');
      }
      
      const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
      
      // Delete file
      await vscode.workspace.fs.delete(fullPath);
      
      return { 
        success: true, 
        summary: `Deleted file: ${filePath}` 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        summary: `Failed to delete file: ${filePath}`,
        error: errorMessage
      };
    }
  }
}
