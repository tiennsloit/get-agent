import z from "zod";

// FlowTitleRequest schema
const FlowTitleRequestSchema = z.object({
    userRequest: z.string()
});

// FlowTitleResponse schema
const FlowTitleResponseSchema = z.object({
    title: z.string()
});

// Type definitions
export type FlowTitleRequest = z.infer<typeof FlowTitleRequestSchema>;
export type FlowTitleResponse = z.infer<typeof FlowTitleResponseSchema>;

// Export schemas
export { FlowTitleRequestSchema, FlowTitleResponseSchema };
