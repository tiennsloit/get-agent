import { BlueprintTask } from "./generateBlueprint";
import { RelatedFile } from "./getRelatedFiles";

export interface SubtaskRequest {
    currentFilePath: string;
    currentFileContent: string;
    projectStructure: string;
    relatedFiles: Array<RelatedFile>;
    outlineTasks: Array<BlueprintTask>;
    currentTask: BlueprintTask;
}

/**
 * The type of subtask — drives UI rendering (icon, layout, behavior)
 */
type SubtaskType =
    | 'narrative'     // Explanatory step (no action)
    | 'analysis'      // Inspect current state
    | 'edit'          // Modify existing file
    | 'create'        // Create new file or directory
    | 'delete'        // Remove file
    | 'command'       // Run shell command
    | 'test'          // Run tests
    | 'verification'  // Confirm correctness
    | 'summary';      // Final completion message

/**
 * The type of actionable content in the step
 */
type ActionType = 'code' | 'command' | 'none';

/**
 * Syntax highlighting language
 */
type SyntaxHighlight =
    | 'javascript'
    | 'typescript'
    | 'json'
    | 'html'
    | 'css'
    | 'sh'
    | 'bash'
    | 'yaml'
    | 'dockerfile'
    | 'none';

/**
 * Visual hint for the UI to enhance feedback
 */
type VisualHint =
    | 'diff'          // Show as code diff
    | 'terminal'      // Render in terminal emulator
    | 'file-tree'     // Animate file creation in tree
    | 'notification'  // Show toast or banner
    | 'none';         // Inline text only

/**
 * Action to be performed in this step
 */
interface SubtaskAction {
    type: ActionType;
    syntax: SyntaxHighlight;
    target: string;           // File path or system component
    range?: [number, number]; // [startLine, endLine] (1-indexed)
    value: string;            // Exact content to write or command to run
}

/**
 * Single subtask in the execution flow
 */
interface Subtask {
    id: number;                     // 1-indexed step number
    type: SubtaskType;              // Category of step
    title: string;                  // Short action-oriented title (≤8 words)
    body: string;                   // Narrative explanation (what & why)
    action: SubtaskAction;          // Technical action to show/execute
    outcome: string;                // Expected result after step
    visualHint: VisualHint;         // UI animation hint
    autoAdvance: boolean;           // Auto-proceed after execution (safe/faster steps)
}

/**
 * Full subtask flow — array of ordered steps
 */
export type SubtaskFlow = Subtask[];