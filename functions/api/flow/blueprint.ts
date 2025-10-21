import { BlueprintRequestSchema, BlueprintRequest, AnalysisContext, ExplorationSummary } from '../../models/blueprint';
import { ExplorationHistory, CumulativeKnowledge } from '../../models/explorer';
import { Message } from '../../../shared/models/message';
import { systemPrompt, assistantPrompt, blueprintUserPrompt } from '../../prompts/flow/blueprint';
import { AIService } from '../../services/aiService';
import { badRequest, internalError, methodNotAllowed } from '../../utils/response';

export default async function handler(request: Request): Promise<Response> {
    try {
        if (request.method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        // Extract and validate request body
        const body = await request.json();
        const parsedRequest = BlueprintRequestSchema.safeParse(body);

        if (!parsedRequest.success) {
            return badRequest('Invalid request format: ' + parsedRequest.error.message);
        }

        const {
            implementationGoal,
            explorationSummary,
            explorationHistory,
            cumulativeKnowledge,
            analysisContext
        } = parsedRequest.data as BlueprintRequest;

        // Build analysis context section if available
        let analysisContextSection = '';
        if (analysisContext) {
            const ctx = analysisContext as NonNullable<AnalysisContext>;
            analysisContextSection = `### ANALYSIS CONTEXT
                **Core Requirement**:
                - Summary: ${ctx.core_requirement.summary}
                - Main Objective: ${ctx.core_requirement.main_objective}
                - Type: ${ctx.core_requirement.type}

                **Technical Tasks**:
                ${ctx.technical_tasks.map((task: string) => `- ${task}`).join('\n')}

                **Affected Modules**:
                ${ctx.affected_modules.map((module: string) => `- ${module}`).join('\n')}

                **Integration Points**:
                ${ctx.integration_points?.map((ip: any) => `- ${ip.system}: ${ip.endpoint} (${ip.purpose})`).join('\n') || 'None specified'}

                **Risk Factors**:
                ${ctx.risk_factors?.map((risk: string) => `- ${risk}`).join('\n') || 'None specified'}
`;
        }

        // Format exploration history
        const formattedHistory = (explorationHistory as ExplorationHistory[]).map((entry, index) => {
            return `**Iteration ${entry.iteration}** (Understanding: ${(entry.understanding_level * 100).toFixed(0)}%):
                - Action: ${entry.action_summary.type} → ${entry.action_summary.target} (${entry.action_summary.success ? '✓' : '✗'})
                - Key Findings: ${entry.key_findings.join('; ')}
                - Files: ${entry.explored_files.join(', ') || 'None'}`;
        }).join('\n\n');

        // Fill user prompt
        const userPromptWithContent = blueprintUserPrompt
            .replace('{{ implementation_goal }}', implementationGoal as string)
            .replace('{{ total_iterations }}', (explorationSummary as ExplorationSummary).totalIterations.toString())
            .replace('{{ final_understanding_level }}', ((explorationSummary as ExplorationSummary).finalUnderstandingLevel * 100).toFixed(0) + '%')
            .replace('{{ confidence_architecture }}', ((explorationSummary as ExplorationSummary).finalConfidenceScore.architecture * 100).toFixed(0) + '%')
            .replace('{{ confidence_data_flow }}', ((explorationSummary as ExplorationSummary).finalConfidenceScore.data_flow * 100).toFixed(0) + '%')
            .replace('{{ confidence_integration }}', ((explorationSummary as ExplorationSummary).finalConfidenceScore.integration_points * 100).toFixed(0) + '%')
            .replace('{{ confidence_implementation }}', ((explorationSummary as ExplorationSummary).finalConfidenceScore.implementation_details * 100).toFixed(0) + '%')
            .replace('{{ key_findings }}', (explorationSummary as ExplorationSummary).keyFindings.map((f: string) => `- ${f}`).join('\n'))
            .replace('{{ confirmed_facts }}', (cumulativeKnowledge as CumulativeKnowledge).confirmed.map((f: string) => `- ${f}`).join('\n') || '- None')
            .replace('{{ assumptions }}', (cumulativeKnowledge as CumulativeKnowledge).assumptions.map((a: string) => `- ${a}`).join('\n') || '- None')
            .replace('{{ unknowns }}', (cumulativeKnowledge as CumulativeKnowledge).unknowns.map((u: string) => `- ${u}`).join('\n') || '- None')
            .replace('{{ explored_files_count }}', (explorationSummary as ExplorationSummary).exploredFiles.length.toString())
            .replace('{{ explored_files }}', (explorationSummary as ExplorationSummary).exploredFiles.map((f: string) => `- ${f}`).join('\n'))
            .replace('{{ explored_directories_count }}', (explorationSummary as ExplorationSummary).exploredDirectories.length.toString())
            .replace('{{ explored_directories }}', (explorationSummary as ExplorationSummary).exploredDirectories.map((d: string) => `- ${d}`).join('\n'))
            .replace('{{ exploration_history }}', formattedHistory)
            .replace('{{ analysis_context_section }}', analysisContextSection);

        // Prepare messages
        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: assistantPrompt },
            { role: 'user', content: userPromptWithContent }
        ];

        // Create a stream for Server-Sent Events
        const encoder = new TextEncoder();
        let isClosed = false;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    await AIService.completionStream(
                        messages,
                        (chunk: string) => {
                            if (!isClosed) {
                                // Send chunk as SSE
                                const data = `event: chunk\ndata: ${JSON.stringify({ chunk })}\n\n`;
                                controller.enqueue(encoder.encode(data));
                            }
                        },
                        { temperature: 0.3, maxTokens: 16384 }
                    );

                    // Send completion event
                    if (!isClosed) {
                        const data = `event: complete\ndata: ${JSON.stringify({ success: true })}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                } catch (error) {
                    // Send error event
                    if (!isClosed) {
                        const errorMessage = error instanceof Error ? error.message : 'Stream error occurred';
                        const data = `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                } finally {
                    controller.close();
                    isClosed = true;
                }
            },
            cancel() {
                isClosed = true;
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred!';
        return internalError(errorMessage);
    }
}

export const config = {
    runtime: 'edge'
};
