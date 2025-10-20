import { FlowAnalysisRequestSchema, FlowAnalysisResponseSchema } from '../../models/analysis';
import { Message } from '../../../shared/models/message';
import { systemPrompt, assistantPrompt, flowAnalyzeUserPrompt } from '../../prompts/flow/analyze';
import { AIService } from '../../services/aiService';
import { badRequest, internalError, methodNotAllowed, success } from '../../utils/response';

export default async function handler(request: Request): Promise<Response> {
    try {
        if (request.method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        // Extract and validate request body
        const body = await request.json();
        const parsedRequest = FlowAnalysisRequestSchema.safeParse(body);
        
        if (!parsedRequest.success) {
            return badRequest('Invalid request format: ' + parsedRequest.error.message);
        }

        const { userRequest, projectStructure } = parsedRequest.data;

        // Fill user prompt
        const userPromptWithContent = flowAnalyzeUserPrompt
            .replace('{{ user_request }}', userRequest)
            .replace('{{ code_structure }}', JSON.stringify(projectStructure, null, 2));

        // Prepare messages
        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: assistantPrompt },
            { role: 'user', content: userPromptWithContent }
        ];

        // Call AI service with schema validation
        const response = await AIService.completionWithSchema(messages, FlowAnalysisResponseSchema);

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
