import z from "zod";

// ExplorerResponse schema
const ConfidenceScoreSchema = z.object({
    architecture: z.number(),
    data_flow: z.number(),
    integration_points: z.number(),
    implementation_details: z.number()
});

const CurrentKnowledgeSchema = z.object({
    confirmed: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
    unknowns: z.array(z.string()).default([]),
    explored_files: z.array(z.string()).default([]),
    explored_directories: z.array(z.string()).default([])
});

// Specific action schemas with discriminated union
const ReadFileActionSchema = z.object({
    type: z.literal('read_file'),
    parameters: z.object({
        path: z.string().min(1, "File path is required for read_file action")
    }),
    reason: z.string().default(""),
    expected_insights: z.array(z.string()).default([])
});

const SearchContentActionSchema = z.object({
    type: z.literal('search_content'),
    parameters: z.object({
        query: z.string().min(1, "Query is required for search_content action"),
        scope: z.string().optional().default("")
    }),
    reason: z.string().default(""),
    expected_insights: z.array(z.string()).default([])
});

const ReadTerminalActionSchema = z.object({
    type: z.literal('read_terminal'),
    parameters: z.object({
        command: z.string().min(1, "Command is required for read_terminal action")
    }),
    reason: z.string().default(""),
    expected_insights: z.array(z.string()).default([])
});

const ListDirectoryActionSchema = z.object({
    type: z.literal('list_directory'),
    parameters: z.object({
        path: z.string().min(1, "Path is required for list_directory action"),
        recursive: z.boolean().optional().default(false)
    }),
    reason: z.string().default(""),
    expected_insights: z.array(z.string()).default([])
});

// Discriminated union of all action types
const ActionSchema = z.discriminatedUnion('type', [
    ReadFileActionSchema,
    SearchContentActionSchema,
    ReadTerminalActionSchema,
    ListDirectoryActionSchema
]);

// Legacy parameter schemas for backward compatibility
const ReadFileParametersSchema = z.object({
    path: z.string()
});

const SearchContentParametersSchema = z.object({
    query: z.string(),
    scope: z.string().optional()
});

const ReadTerminalParametersSchema = z.object({
    command: z.string()
});

const ListDirectoryParametersSchema = z.object({
    path: z.string(),
    recursive: z.boolean().optional()
});

const ActionParametersSchema = z.union([
    ReadFileParametersSchema,
    SearchContentParametersSchema,
    ReadTerminalParametersSchema,
    ListDirectoryParametersSchema
]);

const ObservationSchema = z.object({
    from_previous_action: z.record(z.string(), z.any()).default({})
}).default({ from_previous_action: {} });

const ExplorerResponseSchema = z.object({
    iteration: z.number(),
    understanding_level: z.number(),
    confidence_score: ConfidenceScoreSchema,
    thinking: z.string().default(""),
    current_knowledge: CurrentKnowledgeSchema,
    action: ActionSchema,
    observation: ObservationSchema,
    continue_exploration: z.boolean(),
    next_priorities: z.array(z.string()).default([])
});

// Action summary schema for exploration history
const ActionSummarySchema = z.object({
    type: z.string(),
    target: z.string().default(""),
    success: z.boolean()
});

// Exploration history schema
const ExplorationHistorySchema = z.object({
    iteration: z.number(),
    understanding_level: z.number(),
    action_summary: ActionSummarySchema,
    key_findings: z.array(z.string()).default([]),
    explored_files: z.array(z.string()).default([]),
    explored_directories: z.array(z.string()).default([]),
    observation: z.union([z.record(z.string(), z.any()), z.string()]).default({}) // Enhanced: observation from action execution
});

// Cumulative knowledge schema
const CumulativeKnowledgeSchema = z.object({
    confirmed: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
    unknowns: z.array(z.string()).default([]),
    explored_files: z.array(z.string()).default([]),
    explored_directories: z.array(z.string()).default([])
});

// ExplorerRequest schema
const ExplorerRequestSchema = z.object({
    implementationGoal: z.string(),
    // Legacy fields for backward compatibility
    previousJsonResponse: ExplorerResponseSchema.nullable().optional(),
    previousObservation: z.string().nullable().optional(),
    // New enhanced fields
    explorationHistory: z.array(ExplorationHistorySchema).optional(),
    cumulativeKnowledge: CumulativeKnowledgeSchema.optional(),
    // Alternative naming for history field
    history: z.array(ExplorationHistorySchema).optional()
});

// Type definitions
export type ExplorerRequest = z.infer<typeof ExplorerRequestSchema>;
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;
export type CurrentKnowledge = z.infer<typeof CurrentKnowledgeSchema>;
export type ReadFileParameters = z.infer<typeof ReadFileParametersSchema>;
export type SearchContentParameters = z.infer<typeof SearchContentParametersSchema>;
export type ReadTerminalParameters = z.infer<typeof ReadTerminalParametersSchema>;
export type ListDirectoryParameters = z.infer<typeof ListDirectoryParametersSchema>;
export type ActionParameters = z.infer<typeof ActionParametersSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type ExplorerResponse = z.infer<typeof ExplorerResponseSchema>;
export type ActionSummary = z.infer<typeof ActionSummarySchema>;
export type ExplorationHistory = z.infer<typeof ExplorationHistorySchema>;
export type CumulativeKnowledge = z.infer<typeof CumulativeKnowledgeSchema>;

// Export schemas
export { ExplorerRequestSchema, ExplorerResponseSchema, ExplorationHistorySchema, CumulativeKnowledgeSchema };