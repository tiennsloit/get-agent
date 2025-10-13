import z from "zod";

// FlowAnalysisRequest schema
const FlowAnalysisRequestSchema = z.object({
    userRequest: z.string(),
    projectStructure: z.array(z.object({
        path: z.string(),
        language: z.string(),
    }))
});

// FlowAnalysisResponse schema
const IntegrationPointSchema = z.object({
    system: z.string(),
    endpoint: z.string(),
    purpose: z.string()
});

const ExplorationTargetsSchema = z.object({
    files: z.array(z.string()),
    directories: z.array(z.string()),
    patterns: z.array(z.string())
});

const ComplexityFactorsSchema = z.object({
    integration_complexity: z.string(),
    testing_requirements: z.string(),
    refactoring_needed: z.string(),
    external_dependencies: z.string()
});

const FlowAnalysisResponseSchema = z.object({
    core_requirement: z.object({
        summary: z.string(),
        main_objective: z.string(),
        type: z.string()
    }),
    technical_tasks: z.array(z.string()),
    affected_modules: z.array(z.string()),
    integration_points: z.array(IntegrationPointSchema),
    search_keywords: z.array(z.string()),
    exploration_targets: ExplorationTargetsSchema,
    estimated_complexity: z.string(),
    complexity_factors: ComplexityFactorsSchema,
    prerequisites: z.array(z.string()),
    risk_factors: z.array(z.string())
});

// Type definitions
export type FlowAnalysisRequest = z.infer<typeof FlowAnalysisRequestSchema>;
export type IntegrationPoint = z.infer<typeof IntegrationPointSchema>;
export type ExplorationTargets = z.infer<typeof ExplorationTargetsSchema>;
export type ComplexityFactors = z.infer<typeof ComplexityFactorsSchema>;
export type FlowAnalysisResponse = z.infer<typeof FlowAnalysisResponseSchema>;

// Export schemas
export { FlowAnalysisRequestSchema, FlowAnalysisResponseSchema };
