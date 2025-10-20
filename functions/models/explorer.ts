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
    unknowns: z.array(z.string())
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

// ExplorerRequest schema
const ExplorerRequestSchema = z.object({
    implementationGoal: z.string(),
    previousJsonResponse: ExplorerResponseSchema.nullable().optional(),
    previousObservation: z.string().nullable().optional()
});

// Type definitions
export type ExplorerRequest = z.infer<typeof ExplorerRequestSchema>;
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;
export type CurrentKnowledge = z.infer<typeof CurrentKnowledgeSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type ExplorerResponse = z.infer<typeof ExplorerResponseSchema>;

// Export schemas
export { ExplorerRequestSchema, ExplorerResponseSchema };