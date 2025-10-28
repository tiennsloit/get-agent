import z from "zod";

// Simple task schema
const TaskItemSchema = z.object({
  type: z.literal("task"),
  content: z.string().min(1, "Task content cannot be empty")
});

// Phase with tasks schema
const PhaseItemSchema = z.object({
  type: z.literal("phase"),
  name: z.string().min(1, "Phase name cannot be empty"),
  tasks: z.array(z.string().min(1, "Task content cannot be empty"))
});

// Discriminated union for TODO items
const TodoItemSchema = z.discriminatedUnion("type", [
  TaskItemSchema,
  PhaseItemSchema
]);

// TODO Request Schema
const TodoRequestSchema = z.object({
  blueprintContent: z.string().min(100, "Blueprint content must be at least 100 characters"),
  implementationGoal: z.string().optional()
});

// TODO Response Schema
const TodoResponseSchema = z.object({
  items: z.array(TodoItemSchema)
});

// Type definitions
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type PhaseItem = z.infer<typeof PhaseItemSchema>;
export type TodoItem = z.infer<typeof TodoItemSchema>;
export type TodoRequest = z.infer<typeof TodoRequestSchema>;
export type TodoResponse = z.infer<typeof TodoResponseSchema>;

// Export schemas
export { TodoRequestSchema, TodoResponseSchema, TodoItemSchema };
