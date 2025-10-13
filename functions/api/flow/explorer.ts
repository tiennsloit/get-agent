import { Message } from '../../models/message';
import { ExplorerRequestSchema, ExplorerResponseSchema } from '../../models/explorer';
import { systemPrompt, assistantPrompt, codeExploreUserPrompt } from '../../prompts/flow/explorer';
import { AIService } from '../../services/aiService';
import { badRequest, internalError, methodNotAllowed, success } from '../../utils/response';

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

        const { implementationGoal, projectStructure, previousJsonResponse, previousObservation } = parsedRequest.data;

        // Fill user prompt
        const userPromptWithContent = codeExploreUserPrompt
            .replace('{{ implementation_goal }}', implementationGoal)
            .replace('{{ project_structure }}', JSON.stringify(projectStructure, null, 2))
            .replace('{{ previous_json_response }}', previousJsonResponse ? JSON.stringify(previousJsonResponse, null, 2) : 'None')
            .replace('{{ previous_observation }}', JSON.stringify(previousObservation, null, 2) || 'None');

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