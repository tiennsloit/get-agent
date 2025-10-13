// edgeResponse.ts

export type EdgeResponseOptions = {
    status?: number;
    headers?: Record<string, string>;
    body?: any;
};

export function createResponse(options: EdgeResponseOptions = {}): Response {
    const {
        status = 200,
        headers = {},
        body = {},
    } = options;

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: defaultHeaders,
        }
    );
}

export function success(body: any, options: EdgeResponseOptions = {}): Response {
    return createResponse({ ...options, status: 200, body });
}

export function notFound(message: string = 'Not Found'): Response {
    return createResponse({
        status: 404,
        body: { error: 'not_found', message },
    });
}

export function unauthorized(message: string = 'Unauthorized'): Response {
    return createResponse({
        status: 401,
        body: { error: 'unauthorized', message },
    });
}

export function methodNotAllowed(allowed: string[] = ['GET'], message?: string): Response {
    return createResponse({
        status: 405,
        headers: { 'Allow': allowed.join(', ') },
        body: { error: 'method_not_allowed', message: message || `Allowed methods: ${allowed.join(', ')}` },
    });
}

export function badRequest(message: string = 'Bad Request'): Response {
    return createResponse({
        status: 400,
        body: { error: 'bad_request', message },
    });
}

export function internalError(message: string = 'Internal Server Error'): Response {
    return createResponse({
        status: 500,
        body: { error: 'internal_error', message },
    });
}
