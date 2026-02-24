import { SimulateResponse, TraceStep } from '../types';

interface RequestInput {
    method: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
}

function hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function latency(req: RequestInput): number {
    const hash = hashCode(JSON.stringify(req));
    return 80 + (hash % 161);
}

export function handlePostJsonValidation(req: RequestInput): SimulateResponse {
    const trace: TraceStep[] = [];
    const lat = latency(req);

    trace.push({ stage: 'client', msg: `Browser sends ${req.method} request to /users`, ok: true });

    // Method guard
    if (req.method !== 'POST') {
        trace.push({ stage: 'server', msg: `Method ${req.method} is not allowed on /users — only POST is supported`, ok: false });
        return {
            http: {
                status: 405,
                headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
                body: { error: `Method ${req.method} not allowed. Use POST to create a new user.` },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: '405 Method Not Allowed',
                explanation: `The /users endpoint only supports POST for creating new resources. You sent ${req.method}. In REST, POST is used to submit data that the server processes and stores — GET would be used on a different endpoint to retrieve users.`,
                fixSteps: ['Change the method to POST in the request builder', 'Ensure you also include a JSON body with name and email fields'],
                commonMistakes: ['Using GET when trying to create a resource', 'Forgetting that POST requires a request body'],
            },
        };
    }

    trace.push({ stage: 'server', msg: 'Server receives POST /users', ok: true });
    trace.push({ stage: 'auth', msg: 'No authentication required', ok: true });

    // Check Content-Type
    const ct = (req.headers['Content-Type'] || req.headers['content-type'] || '').toLowerCase();
    if (!ct.includes('application/json')) {
        trace.push({
            stage: 'validation',
            msg: `Missing or wrong Content-Type header: "${ct || 'none'}"`,
            highlight: { type: 'header', key: 'Content-Type' },
            ok: false,
        });
        return {
            http: {
                status: 415,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Unsupported Media Type. Content-Type must be application/json.' },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Missing Content-Type Header',
                explanation: 'When sending JSON data in a POST request, you must include the Content-Type: application/json header. This tells the server how to parse the request body. Without it, the server doesn\'t know the format of your data.',
                fixSteps: [
                    'Add the header: Content-Type: application/json',
                    'Make sure the header value is exactly "application/json"',
                ],
                commonMistakes: [
                    'Forgetting the Content-Type header entirely',
                    'Using text/plain or text/html instead of application/json',
                    'Misspelling the header name',
                ],
            },
        };
    }

    // Check JSON parsing
    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(req.body);
    } catch {
        trace.push({
            stage: 'validation',
            msg: 'Request body is not valid JSON',
            highlight: { type: 'body' },
            ok: false,
        });
        return {
            http: {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Invalid JSON in request body.' },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Invalid JSON Body',
                explanation: 'The request body could not be parsed as JSON. JSON requires double-quoted keys and string values, proper comma separation, and matching braces.',
                fixSteps: [
                    'Ensure all keys are wrapped in double quotes: { "name": "value" }',
                    'Check for trailing commas — JSON doesn\'t allow them',
                    'Use a JSON validator to check your syntax',
                ],
                commonMistakes: [
                    'Using single quotes instead of double quotes',
                    'Leaving trailing commas after the last property',
                    'Missing quotes around keys: { name: "value" } is invalid',
                ],
            },
        };
    }

    // Validate fields
    trace.push({ stage: 'validation', msg: 'Checking required fields: name, email', ok: true });

    const errors: string[] = [];
    if (!parsed.name || typeof parsed.name !== 'string' || (parsed.name as string).trim().length === 0) {
        errors.push('name is required and must be a non-empty string');
    }
    if (!parsed.email || typeof parsed.email !== 'string') {
        errors.push('email is required and must be a string');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(parsed.email as string)) {
            errors.push('email must be a valid email format (e.g., user@example.com)');
        }
    }

    if (errors.length > 0) {
        trace.push({
            stage: 'validation',
            msg: `Validation failed: ${errors.join('; ')}`,
            highlight: { type: 'body' },
            ok: false,
        });
        return {
            http: {
                status: 422,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Validation failed', details: errors },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Validation Error (422)',
                explanation: 'The server understood your JSON but the data didn\'t pass validation. A 422 Unprocessable Entity means the syntax is correct but the content has semantic errors.',
                fixSteps: [
                    'Ensure "name" is a non-empty string',
                    'Ensure "email" is a valid email format like user@example.com',
                    'Check the error details array for specific issues',
                ],
                commonMistakes: [
                    'Sending an empty name: { "name": "", "email": "..." }',
                    'Using an invalid email format like "notanemail"',
                    'Misspelling field names (e.g., "Name" vs "name")',
                ],
            },
        };
    }

    // Success
    trace.push({ stage: 'service', msg: 'Processing new user creation', ok: true });
    trace.push({ stage: 'db', msg: 'Inserting user into database', ok: true });

    const newUser = {
        id: hashCode(req.body) % 9000 + 1000,
        name: parsed.name,
        email: parsed.email,
        createdAt: new Date().toISOString(),
    };

    trace.push({ stage: 'response', msg: `Returning 201 Created with new user id=${newUser.id}`, ok: true });

    return {
        http: {
            status: 201,
            headers: { 'Content-Type': 'application/json', 'Location': `/users/${newUser.id}` },
            body: newUser,
            latencyMs: lat,
        },
        trace,
        teaching: {
            title: 'User Created Successfully',
            explanation: 'Your POST request created a new resource. The 201 Created status code indicates success, and the Location header tells you where to find the new resource. The response body contains the created object with a server-generated ID.',
            fixSteps: [],
            commonMistakes: [
                'Forgetting to check the response for the new resource ID',
                'Not following the Location header for the canonical URL',
            ],
        },
    };
}
