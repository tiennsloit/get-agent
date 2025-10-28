import { TodoRequestSchema, TodoRequest, TodoResponseSchema, TodoResponse } from '../../models/todo';
import { Message } from '../../../shared/models/message';
import { systemPrompt, assistantPrompt, todoUserPrompt } from '../../prompts/flow/todo';
import { AIService } from '../../services/aiService';
import { success, badRequest, internalError, methodNotAllowed } from '../../utils/response';

export default async function handler(request: Request): Promise<Response> {
    try {
        // Validate HTTP method
        if (request.method !== 'POST') {
            return methodNotAllowed(['POST']);
        }

        // Extract and validate request body
        const body = await request.json();
        const parsedRequest = TodoRequestSchema.safeParse(body);

        if (!parsedRequest.success) {
            return badRequest('Invalid request format: ' + parsedRequest.error.message);
        }

        const { blueprintContent, implementationGoal } = parsedRequest.data as TodoRequest;

        // Build implementation goal section if provided
        let implementationGoalSection = '';
        if (implementationGoal) {
            implementationGoalSection = `### IMPLEMENTATION GOAL\n\n${implementationGoal}`;
        }

        // Populate user prompt template
        const userPromptWithContent = todoUserPrompt
            .replace('{{ blueprint_content }}', blueprintContent)
            .replace('{{ implementation_goal_section }}', implementationGoalSection);

        // Prepare messages for AI service
        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: assistantPrompt },
            { role: 'user', content: userPromptWithContent }
        ];

        // Invoke AI service with schema validation
        const todoResponse = await AIService.completionWithSchema<TodoResponse>(
            messages,
            TodoResponseSchema
        );

        // Return successful response with TODO list
        return success(todoResponse);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred!';
        console.error('TODO API Error:', error);
        return internalError(errorMessage);
    }
}

export const config = {
    runtime: 'edge'
};
