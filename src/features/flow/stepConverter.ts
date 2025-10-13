/**
 * Step converter for converting flow tasks to execution steps
 */

import type { Task } from '../../types/flowState';
import type { ExecutionStep } from '../../types/stepTypes';
import { StepType } from '../../types/stepTypes';
import { generateId } from '../../core/utilities/generateId';

export class StepConverter {
  /**
   * Convert a flow task to execution steps
   */
  public static convertTaskToSteps(task: Task): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    
    // Add informational step
    steps.push({
      id: generateId(),
      type: StepType.TEXT,
      description: `Starting task: ${task.title}`,
      status: 'pending',
      data: {
        type: StepType.TEXT,
        content: `${task.description}\n\nThis task will modify the following files:\n${task.files.map(f => `- ${f.action}: ${f.file}`).join('\n')}`
      }
    });
    
    // Convert file operations to steps
    for (const file of task.files) {
      switch (file.action) {
        case 'add':
          steps.push({
            id: generateId(),
            type: StepType.FILE_ADD,
            description: `Create file: ${file.file}`,
            status: 'pending',
            data: {
              type: StepType.FILE_ADD,
              path: file.file,
              content: '// TODO: Implement file content'
            }
          });
          break;
          
        case 'edit':
          steps.push({
            id: generateId(),
            type: StepType.FILE_EDIT,
            description: `Modify file: ${file.file}`,
            status: 'pending',
            data: {
              type: StepType.FILE_EDIT,
              path: file.file,
              range: { start: 1, end: 1 },
              newContent: '// TODO: Implement file modifications'
            }
          });
          break;
          
        case 'remove':
          steps.push({
            id: generateId(),
            type: StepType.FILE_REMOVE,
            description: `Delete file: ${file.file}`,
            status: 'pending',
            data: {
              type: StepType.FILE_REMOVE,
              path: file.file
            }
          });
          break;
      }
    }
    
    // Add completion step
    steps.push({
      id: generateId(),
      type: StepType.TEXT,
      description: `Complete task: ${task.title}`,
      status: 'pending',
      data: {
        type: StepType.TEXT,
        content: `Task completed successfully. All file operations have been executed.`
      }
    });
    
    return steps;
  }
  
  /**
   * Convert subtasks from API to execution steps
   */
  public static convertSubtasksToSteps(subtasks: any[]): ExecutionStep[] {
    return subtasks.map(subtask => ({
      id: generateId(),
      type: this.mapSubtaskTypeToStepType(subtask.action.type),
      description: subtask.title,
      status: 'pending' as const,
      summary: subtask.outcome,
      data: {
        type: this.mapSubtaskTypeToStepType(subtask.action.type),
        ...this.mapSubtaskActionToStepData(subtask.action)
      }
    }));
  }
  
  /**
   * Map subtask action type to step type
   */
  private static mapSubtaskTypeToStepType(actionType: string): StepType {
    switch (actionType) {
      case 'code':
        // Determine if it's add, edit, or remove based on action
        return StepType.FILE_EDIT; // Default to edit
      case 'command':
        return StepType.COMMAND;
      case 'none':
      default:
        return StepType.TEXT;
    }
  }
  
  /**
   * Map subtask action to step data
   */
  private static mapSubtaskActionToStepData(action: any): any {
    switch (action.type) {
      case 'code':
        if (action.target && action.value) {
          if (action.range) {
            return {
              path: action.target,
              range: { start: action.range[0], end: action.range[1] },
              newContent: action.value
            };
          } else {
            return {
              path: action.target,
              content: action.value
            };
          }
        }
        return { content: action.value || '' };
        
      case 'command':
        return { command: action.value || '' };
        
      case 'none':
      default:
        return { content: action.value || '' };
    }
  }
}