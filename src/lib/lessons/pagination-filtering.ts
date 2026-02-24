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

const ORDERS = Array.from({ length: 47 }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(4, '0')}`,
    customer: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
    amount: Math.round((10 + (hashCode(`order${i}`) % 990)) * 100) / 100,
    status: (['pending', 'paid', 'cancelled'] as const)[i % 3],
    createdAt: new Date(2024, 0, 1 + i).toISOString(),
}));

export function handlePaginationFiltering(req: RequestInput): SimulateResponse {
    const trace: TraceStep[] = [];
    const lat = latency(req);

    trace.push({ stage: 'client', msg: `Browser sends ${req.method} request to /orders`, ok: true });

    // Method guard
    if (req.method !== 'GET') {
        trace.push({ stage: 'server', msg: `Method ${req.method} is not allowed on /orders — only GET is supported`, ok: false });
        return {
            http: {
                status: 405,
                headers: { 'Content-Type': 'application/json', 'Allow': 'GET' },
                body: { error: `Method ${req.method} not allowed. Use GET to retrieve orders.` },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: '405 Method Not Allowed',
                explanation: `The /orders endpoint only supports GET for listing and filtering orders. You sent ${req.method}. Use GET with query parameters like ?page=1&limit=10&status=paid to paginate and filter results.`,
                fixSteps: ['Change the method to GET', 'Add pagination query params: page and limit'],
                commonMistakes: ['Using POST to query/filter data (use GET with query params instead)', 'Forgetting that read-only endpoints should use GET'],
            },
        };
    }

    trace.push({ stage: 'server', msg: 'Server receives GET /orders', ok: true });
    trace.push({ stage: 'auth', msg: 'No authentication required', ok: true });

    // Validate params
    const page = parseInt(req.query.page || '');
    const limit = parseInt(req.query.limit || '');
    const status = req.query.status || '';

    if (!req.query.page || !req.query.limit) {
        trace.push({
            stage: 'validation',
            msg: 'Missing required pagination params: page and limit',
            highlight: { type: 'query', key: !req.query.page ? 'page' : 'limit' },
            ok: false,
        });
        return {
            http: { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Both page and limit query parameters are required.' }, latencyMs: lat },
            trace,
            teaching: {
                title: 'Missing Pagination Parameters',
                explanation: 'This endpoint requires both "page" and "limit" query parameters to paginate results. Without them, the server can\'t determine which slice of data to return.',
                fixSteps: ['Add ?page=1&limit=10 to your request URL', 'Both parameters must be present'],
                commonMistakes: ['Omitting pagination params entirely', 'Including page but forgetting limit'],
            },
        };
    }

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 50) {
        trace.push({
            stage: 'validation',
            msg: `Invalid pagination: page=${req.query.page}, limit=${req.query.limit}`,
            highlight: { type: 'query' },
            ok: false,
        });
        return {
            http: { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'page must be ≥ 1 and limit must be 1-50.' }, latencyMs: lat },
            trace,
            teaching: {
                title: 'Invalid Pagination Values',
                explanation: 'Page must be a positive integer and limit must be between 1 and 50.',
                fixSteps: ['Set page to 1 or higher', 'Set limit between 1 and 50'],
                commonMistakes: ['Setting page to 0', 'Setting limit too high'],
            },
        };
    }

    const validStatuses = ['pending', 'paid', 'cancelled', ''];
    if (!validStatuses.includes(status)) {
        trace.push({
            stage: 'validation',
            msg: `Invalid status filter: "${status}" — must be pending, paid, or cancelled`,
            highlight: { type: 'query', key: 'status' },
            ok: false,
        });
        return {
            http: { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: `Invalid status. Allowed: pending, paid, cancelled. Received: "${status}"` }, latencyMs: lat },
            trace,
            teaching: {
                title: 'Invalid Filter Value',
                explanation: 'The status filter only accepts specific enum values. Sending an unrecognized value results in a 400 error. Always check API documentation for allowed filter values.',
                fixSteps: ['Use one of: pending, paid, cancelled', 'Or omit status to get all orders'],
                commonMistakes: ['Using plural forms (e.g., "pendings")', 'Using different casing (APIs may be case-sensitive)'],
            },
        };
    }

    trace.push({ stage: 'validation', msg: 'All parameters valid', ok: true });

    // Filter
    let filtered = ORDERS;
    if (status) {
        filtered = ORDERS.filter(o => o.status === status);
    }
    trace.push({ stage: 'service', msg: `Applying ${status ? `status="${status}" filter` : 'no filter'}: ${filtered.length} orders match`, ok: true });

    // Paginate
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    trace.push({ stage: 'db', msg: `Returning page ${page}: items ${start + 1}-${start + paged.length} of ${filtered.length}`, ok: true });
    trace.push({ stage: 'response', msg: `200 OK with ${paged.length} orders`, ok: true });

    return {
        http: {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Total-Count': String(filtered.length) },
            body: {
                data: paged,
                pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
                filters: { status: status || 'all' },
            },
            latencyMs: lat,
        },
        trace,
        teaching: {
            title: 'Paginated & Filtered Results',
            explanation: 'The response contains a slice of the total dataset determined by page and limit, with an optional status filter applied. The pagination metadata lets your client build navigation UI.',
            fixSteps: [],
            commonMistakes: ['Not handling empty pages gracefully', 'Ignoring totalPages when building pagination UI'],
        },
    };
}
