import { FlowTitleRequestSchema, FlowTitleResponseSchema } from '../../models/title';
import { Message } from '../../../shared/models/message';
import { systemPrompt, assistantPrompt, flowTitleUserPrompt } from '../../prompts/flow/title';
import { AIService } from '../../services/aiService';
import { badRequest, internalError, methodNotAllowed, success } from '../../utils/response';

export default async function handler(request: Request): Promise<Response> {
    try {
        if (request.method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        // Extract and validate request body
        const body = await request.json();
        const parsedRequest = FlowTitleRequestSchema.safeParse(body);
        
        if (!parsedRequest.success) {
            return badRequest('Invalid request format: ' + parsedRequest.error.message);
        }

        const { userRequest } = parsedRequest.data;

        // Fill user prompt
        const userPromptWithContent = flowTitleUserPrompt
            .replace('{{ user_request }}', userRequest);

        // Prepare messages
        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: assistantPrompt },
            { role: 'user', content: userPromptWithContent }
        ];

        // Call AI service with schema validation
        const response = await AIService.completionWithSchema(messages, FlowTitleResponseSchema);

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
