import z from "zod";
import { ExplorationHistorySchema, CumulativeKnowledgeSchema } from "./explorer";

// Blueprint request schema
const ExplorationSummarySchema = z.object({
    totalIterations: z.number(),
    finalUnderstandingLevel: z.number().min(0).max(1),
    finalConfidenceScore: z.object({
        architecture: z.number(),
        data_flow: z.number(),
        integration_points: z.number(),
        implementation_details: z.number()
    }),
    exploredFiles: z.array(z.string()),
    exploredDirectories: z.array(z.string()),
    keyFindings: z.array(z.string()).max(10)
});

const AnalysisContextSchema = z.object({
    core_requirement: z.object({
        summary: z.string(),
        main_objective: z.string(),
        type: z.string()
    }),
    technical_tasks: z.array(z.string()),
    affected_modules: z.array(z.string()),
    integration_points: z.array(z.object({
        system: z.string(),
        endpoint: z.string(),
        purpose: z.string()
    })).optional(),
    search_keywords: z.array(z.string()).optional(),
    exploration_targets: z.object({
        files: z.array(z.string()),
        directories: z.array(z.string()),
        patterns: z.array(z.string())
    }).optional(),
    estimated_complexity: z.string().optional(),
    complexity_factors: z.object({
        integration_complexity: z.string(),
        testing_requirements: z.string(),
        refactoring_needed: z.string(),
        external_dependencies: z.string()
    }).optional(),
    prerequisites: z.array(z.string()).optional(),
    risk_factors: z.array(z.string()).optional()
}).optional();

const BlueprintRequestSchema = z.object({
    implementationGoal: z.string().min(10),
    explorationSummary: ExplorationSummarySchema,
    explorationHistory: z.array(ExplorationHistorySchema),
    cumulativeKnowledge: CumulativeKnowledgeSchema,
    analysisContext: AnalysisContextSchema
});

// Type definitions
export type ExplorationSummary = z.infer<typeof ExplorationSummarySchema>;
export type AnalysisContext = z.infer<typeof AnalysisContextSchema>;
export type BlueprintRequest = z.infer<typeof BlueprintRequestSchema>;

// Export schemas
export { BlueprintRequestSchema };
