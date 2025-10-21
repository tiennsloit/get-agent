import z from "zod";

// ExplorerResponse schema
const ConfidenceScoreSchema = z.object({
    architecture: z.number(),
    data_flow: z.number(),
    integration_points: z.number(),
    implementation_details: z.number()
});

const CurrentKnowledgeSchema = z.object({
    confirmed: z.array(z.string()),
    assumptions: z.array(z.string()),
    unknowns: z.array(z.string()),
    explored_files: z.array(z.string()).optional(),
    explored_directories: z.array(z.string()).optional()
});

const ActionSchema = z.object({
    type: z.string(),
    parameters: z.record(z.string(), z.any()),
    reason: z.string(),
    expected_insights: z.array(z.string())
});

const ObservationSchema = z.object({
    from_previous_action: z.record(z.string(), z.any()).nullable()
});

const ExplorerResponseSchema = z.object({
    iteration: z.number(),
    understanding_level: z.number(),
    confidence_score: ConfidenceScoreSchema,
    thinking: z.string(),
    current_knowledge: CurrentKnowledgeSchema,
    action: ActionSchema,
    observation: ObservationSchema.nullable(),
    continue_exploration: z.boolean(),
    next_priorities: z.array(z.string())
});

// Action summary schema for exploration history
const ActionSummarySchema = z.object({
    type: z.string(),
    target: z.string(),
    success: z.boolean()
});

// Exploration history schema
const ExplorationHistorySchema = z.object({
    iteration: z.number(),
    understanding_level: z.number(),
    action_summary: ActionSummarySchema,
    key_findings: z.array(z.string()),
    explored_files: z.array(z.string()),
    explored_directories: z.array(z.string()),
    observation: z.union([z.record(z.string(), z.any()), z.string()]).optional() // Enhanced: observation from action execution
});

// Cumulative knowledge schema
const CumulativeKnowledgeSchema = z.object({
    confirmed: z.array(z.string()),
    assumptions: z.array(z.string()),
    unknowns: z.array(z.string()),
    explored_files: z.array(z.string()),
    explored_directories: z.array(z.string())
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
export type Action = z.infer<typeof ActionSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type ExplorerResponse = z.infer<typeof ExplorerResponseSchema>;
export type ActionSummary = z.infer<typeof ActionSummarySchema>;
export type ExplorationHistory = z.infer<typeof ExplorationHistorySchema>;
export type CumulativeKnowledge = z.infer<typeof CumulativeKnowledgeSchema>;

// Export schemas
export { ExplorerRequestSchema, ExplorerResponseSchema, ExplorationHistorySchema, CumulativeKnowledgeSchema };