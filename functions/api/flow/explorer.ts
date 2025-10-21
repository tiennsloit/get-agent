import { Message } from '../../../shared/models/message';
import { ExplorerRequestSchema, ExplorerResponseSchema, ExplorationHistory, CumulativeKnowledge } from '../../models/explorer';
import { systemPrompt, assistantPrompt, codeExploreUserPrompt } from '../../prompts/flow/explorer';
import { AIService } from '../../services/aiService';
import { badRequest, internalError, methodNotAllowed, success } from '../../utils/response';

/**
 * Filter exploration context to optimize token usage
 * Implements 3-tier filtering strategy
 */
function filterExplorationContext(
    explorationHistory?: ExplorationHistory[],
    cumulativeKnowledge?: CumulativeKnowledge
): {
    cumulativeKnowledge: string;
    explorationHistory: string;
    currentIteration: number;
    progressSummary: string;
} {
    // If no history provided, return empty context
    if (!explorationHistory || explorationHistory.length === 0) {
        return {
            cumulativeKnowledge: cumulativeKnowledge ? JSON.stringify(cumulativeKnowledge, null, 2) : 'None',
            explorationHistory: 'None - This is the first iteration',
            currentIteration: 1,
            progressSummary: 'Starting exploration'
        };
    }

    const totalIterations = explorationHistory.length;
    const currentIteration = totalIterations + 1;

    // Tier 1: Recent iterations (last 3) - Full detail including full observations
    const recentHistory = explorationHistory.slice(-3);
    const tier1Context = recentHistory.map(h => ({
        iteration: h.iteration,
        understanding_level: h.understanding_level,
        action: h.action_summary,
        key_findings: h.key_findings.slice(0, 3), // Max 3 findings
        observation: h.observation // Include full observation for recent iterations
    }));

    // Tier 2: Medium history (4-10 iterations back) - Summary only with observation preview
    const mediumHistory = explorationHistory.slice(Math.max(0, totalIterations - 10), Math.max(0, totalIterations - 3));
    const tier2Context = mediumHistory.length > 0 ? {
        iterations: `${mediumHistory[0].iteration}-${mediumHistory[mediumHistory.length - 1].iteration}`,
        actions_performed: mediumHistory.map(h => `${h.action_summary.type} on ${h.action_summary.target}`),
        understanding_progression: mediumHistory.map(h => h.understanding_level),
        observation_summaries: mediumHistory.map(h => {
            if (!h.observation) { return null; }
            const obsStr = typeof h.observation === 'string' ? h.observation : JSON.stringify(h.observation);
            return obsStr.substring(0, 200); // First 200 chars as summary
        }).filter(Boolean)
    } : null;

    // Tier 3: Older history (>10 back) - Aggregate statistics only, no observations
    const olderHistory = explorationHistory.slice(0, Math.max(0, totalIterations - 10));
    const tier3Context = olderHistory.length > 0 ? {
        total_iterations: olderHistory.length,
        avg_understanding_level: olderHistory.reduce((sum, h) => sum + h.understanding_level, 0) / olderHistory.length,
        files_explored: new Set(olderHistory.flatMap(h => h.explored_files)).size,
        directories_explored: new Set(olderHistory.flatMap(h => h.explored_directories)).size
    } : null;

    // Build filtered history string
    const historyParts = [];

    if (tier3Context) {
        historyParts.push(`\n### Early Exploration (Iterations 1-${olderHistory.length})`);
        historyParts.push(JSON.stringify(tier3Context, null, 2));
    }

    if (tier2Context) {
        historyParts.push(`\n### Medium History (Iterations ${tier2Context.iterations})`);
        historyParts.push(JSON.stringify(tier2Context, null, 2));
    }

    historyParts.push(`\n### Recent Context (Last ${recentHistory.length} iterations)`);
    historyParts.push(JSON.stringify(tier1Context, null, 2));

    // Build progress summary
    const allExploredFiles = new Set(explorationHistory.flatMap(h => h.explored_files));
    const allExploredDirs = new Set(explorationHistory.flatMap(h => h.explored_directories));
    const progressSummary = `Total iterations: ${totalIterations}, Files explored: ${allExploredFiles.size}, Directories explored: ${allExploredDirs.size}, Current understanding: ${explorationHistory[totalIterations - 1].understanding_level}`;

    return {
        cumulativeKnowledge: cumulativeKnowledge ? JSON.stringify(cumulativeKnowledge, null, 2) : 'None',
        explorationHistory: historyParts.join('\n'),
        currentIteration,
        progressSummary
    };
}

export default async function handler(request: Request): Promise<Response> {
    try {
        if (request.method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        // Extract and validate request body
        const body = await request.json();
        const parsedRequest = ExplorerRequestSchema.safeParse(body);

        if (!parsedRequest.success) {
            return badRequest('Invalid request format: ' + parsedRequest.error.message);
        }

        const { implementationGoal, previousJsonResponse, previousObservation, explorationHistory, history, cumulativeKnowledge } = parsedRequest.data;

        // Support both 'explorationHistory' and 'history' field names (new format uses 'history')
        const actualHistory = history || explorationHistory;

        // Apply context filtering for token optimization
        const filteredContext = filterExplorationContext(actualHistory, cumulativeKnowledge);

        // Fill user prompt
        const userPromptWithContent = codeExploreUserPrompt
            .replace('{{ implementation_goal }}', implementationGoal)
            .replace('{{ previous_json_response }}', previousJsonResponse ? JSON.stringify(previousJsonResponse, null, 2) : 'None')
            .replace('{{ previous_observation }}', JSON.stringify(previousObservation, null, 2) || 'None')
            .replace('{{ cumulative_knowledge }}', filteredContext.cumulativeKnowledge)
            .replace('{{ exploration_history }}', filteredContext.explorationHistory)
            .replace('{{ current_iteration }}', filteredContext.currentIteration.toString())
            .replace('{{ progress_summary }}', filteredContext.progressSummary);

        // Prepare messages
        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: assistantPrompt },
            { role: 'user', content: userPromptWithContent }
        ];

        // Call AI service with schema validation
        const response = await AIService.completionWithSchema(messages, ExplorerResponseSchema);

        // Return success response
        return success(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred!';
        return internalError(errorMessage);
    }
}

export const config = {
    runtime: 'edge'
};