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
    return 80 + (hash % 161); // 80-240ms
}

const USERS = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com' },
    { id: 5, name: 'Eve Adams', email: 'eve@example.com' },
    { id: 6, name: 'Frank Castle', email: 'frank@example.com' },
    { id: 7, name: 'Grace Hopper', email: 'grace@example.com' },
    { id: 8, name: 'Henry Ford', email: 'henry@example.com' },
    { id: 9, name: 'Ivy Lee', email: 'ivy@example.com' },
    { id: 10, name: 'Jack Ryan', email: 'jack@example.com' },
    { id: 11, name: 'Karen Page', email: 'karen@example.com' },
    { id: 12, name: 'Leo Messi', email: 'leo@example.com' },
];

export function handleGetQueryBasics(req: RequestInput): SimulateResponse {
    const trace: TraceStep[] = [];
    const lat = latency(req);

    // Stage: client
    trace.push({ stage: 'client', msg: `Browser initiates ${req.method} request to /users`, ok: true });

    // Method guard
    if (req.method !== 'GET') {
        trace.push({ stage: 'server', msg: `Method ${req.method} is not allowed on /users — only GET is supported`, ok: false });
        return {
            http: {
                status: 405,
                headers: { 'Content-Type': 'application/json', 'Allow': 'GET' },
                body: { error: `Method ${req.method} not allowed. Use GET to retrieve users.` },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: '405 Method Not Allowed',
                explanation: `The /users endpoint only supports GET requests for retrieving data. You sent ${req.method}, which the server rejected. REST conventions use GET for reading resources — use POST to create, PUT/PATCH to update, and DELETE to remove.`,
                fixSteps: ['Change the method to GET in the request builder', 'Check the Allow response header to see which methods are supported'],
                commonMistakes: ['Using POST when you mean to read data', 'Confusing GET (read) with DELETE (remove)'],
            },
        };
    }

    // Stage: server
    trace.push({ stage: 'server', msg: 'Server receives request on GET /users', ok: true });

    // Stage: auth (no auth needed for this endpoint)
    trace.push({ stage: 'auth', msg: 'No authentication required for this endpoint', ok: true });

    // Stage: validation — check query params
    const page = parseInt(req.query.page || '');
    const limit = parseInt(req.query.limit || '');

    if (isNaN(page) || page < 1) {
        trace.push({
            stage: 'validation',
            msg: `Invalid page parameter: "${req.query.page || ''}" — must be a positive integer`,
            highlight: { type: 'query', key: 'page' },
            ok: false,
        });
        return {
            http: { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Invalid page parameter. Must be a positive integer.' }, latencyMs: lat },
            trace,
            teaching: {
                title: 'Invalid Query Parameter',
                explanation: 'The "page" query parameter must be a positive integer (1, 2, 3, ...). Many APIs use page-based pagination where page=1 is the first page of results.',
                fixSteps: ['Set page to a positive integer, e.g. page=1', 'Remove non-numeric characters from the page value'],
                commonMistakes: ['Setting page to 0 or negative numbers', 'Passing non-numeric values like "abc"', 'Forgetting to include page parameter'],
            },
        };
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
        trace.push({
            stage: 'validation',
            msg: `Invalid limit parameter: "${req.query.limit || ''}" — must be 1-100`,
            highlight: { type: 'query', key: 'limit' },
            ok: false,
        });
        return {
            http: { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Invalid limit parameter. Must be between 1 and 100.' }, latencyMs: lat },
            trace,
            teaching: {
                title: 'Limit Out of Range',
                explanation: 'The "limit" parameter controls how many items are returned per page. APIs typically cap this to prevent abuse — here the max is 100.',
                fixSteps: ['Set limit between 1 and 100, e.g. limit=10', 'Check the API docs for maximum allowed values'],
                commonMistakes: ['Setting limit to 0', 'Requesting too many items (e.g., 999)', 'Using non-numeric values'],
            },
        };
    }

    trace.push({ stage: 'validation', msg: `Query params valid: page=${page}, limit=${limit}`, ok: true });

    // Stage: service
    const search = (req.query.search || '').toLowerCase();
    let filtered = USERS;
    if (search) {
        filtered = USERS.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
    }
    trace.push({ stage: 'service', msg: `Filtering ${USERS.length} users${search ? ` matching "${search}"` : ''} → ${filtered.length} results`, ok: true });

    // Stage: db
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    trace.push({ stage: 'db', msg: `Paginating: page ${page}, limit ${limit}, returning ${paged.length} items`, ok: true });

    // Stage: response
    const body = {
        data: paged,
        pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
        },
    };
    trace.push({ stage: 'response', msg: `Returning 200 OK with ${paged.length} users`, ok: true });

    return {
        http: { status: 200, headers: { 'Content-Type': 'application/json', 'X-Total-Count': String(filtered.length) }, body, latencyMs: lat },
        trace,
        teaching: {
            title: 'Successful GET with Pagination',
            explanation: 'Your GET request successfully retrieved paginated user data. The response includes a pagination object with total count and page info, which clients use to build pagination UIs.',
            fixSteps: [],
            commonMistakes: ['Forgetting to handle the last page having fewer items', 'Not checking totalPages before requesting the next page'],
        },
    };
}
