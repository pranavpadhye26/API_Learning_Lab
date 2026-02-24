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

export function handleCorsPreflight(req: RequestInput): SimulateResponse {
    const trace: TraceStep[] = [];
    const lat = latency(req);

    const origin = req.headers['Origin'] || req.headers['origin'] || '';
    const hasCustomHeader = !!(req.headers['X-Custom'] || req.headers['x-custom']);

    trace.push({ stage: 'client', msg: `Browser at ${origin || 'unknown origin'} sends ${req.method} to /data`, ok: true });

    // Method guard — this lesson focuses on GET requests and CORS
    if (req.method !== 'GET') {
        trace.push({ stage: 'server', msg: `Method ${req.method} is not allowed on /data — only GET is supported`, ok: false });
        return {
            http: {
                status: 405,
                headers: { 'Content-Type': 'application/json', 'Allow': 'GET' },
                body: { error: `Method ${req.method} not allowed. This endpoint only supports GET.` },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: '405 Method Not Allowed',
                explanation: `The /data endpoint only supports GET requests. You sent ${req.method}. This CORS lesson focuses on how browsers handle cross-origin GET requests, including when preflight OPTIONS requests are triggered by custom headers.`,
                fixSteps: ['Change the method to GET', 'Then experiment with adding Origin and X-Custom headers to trigger CORS behavior'],
                commonMistakes: ['Using POST when the endpoint only serves data via GET', 'Confusing the automatic OPTIONS preflight (sent by the browser) with manually sending an OPTIONS request'],
            },
        };
    }

    // Check origin
    if (!origin) {
        trace.push({ stage: 'server', msg: 'Request received without Origin header', ok: true });
        trace.push({ stage: 'auth', msg: 'No CORS check needed (same-origin or server-to-server)', ok: true });
        trace.push({ stage: 'validation', msg: 'Request valid', ok: true });
        trace.push({ stage: 'service', msg: 'Processing data request', ok: true });
        trace.push({ stage: 'db', msg: 'Data fetched', ok: true });
        trace.push({ stage: 'response', msg: '200 OK — No CORS headers needed', ok: true });

        return {
            http: {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { data: [{ id: 1, value: 'Hello from API' }], note: 'No CORS headers because no Origin was sent.' },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Same-Origin Request',
                explanation: 'When no Origin header is present, the request is treated as same-origin (or server-to-server). CORS only applies to cross-origin browser requests. The browser automatically adds the Origin header when your JavaScript makes requests to a different domain.',
                fixSteps: ['Add an Origin header to simulate a cross-origin request, e.g. Origin: http://localhost:3000'],
                commonMistakes: ['Thinking CORS applies to server-to-server requests (it doesn\'t)'],
            },
        };
    }

    trace.push({ stage: 'server', msg: `Cross-origin request from: ${origin}`, ok: true });

    // Custom header triggers preflight
    if (hasCustomHeader) {
        trace.push({
            stage: 'auth',
            msg: '⚠ Custom header detected (X-Custom). Browser would send OPTIONS preflight first!',
            highlight: { type: 'header', key: 'X-Custom' },
            ok: true,
        });
        trace.push({
            stage: 'validation',
            msg: 'Preflight OPTIONS: Server checks Access-Control-Allow-Headers',
            ok: true,
        });

        // Check if origin is allowed
        if (origin !== 'http://localhost:3000') {
            trace.push({
                stage: 'service',
                msg: `Origin "${origin}" is NOT in the allowed origins list`,
                highlight: { type: 'header', key: 'Origin' },
                ok: false,
            });
            return {
                http: {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                    body: { error: 'CORS Error: Origin not allowed. The server\'s Access-Control-Allow-Origin does not include your origin.' },
                    latencyMs: lat,
                },
                trace,
                teaching: {
                    title: 'CORS Blocked — Preflight Failed',
                    explanation: `The browser sent a preflight OPTIONS request because you used a custom header (X-Custom). The server responded that your origin "${origin}" is not allowed. This is CORS in action — the browser blocks the actual request to protect users from malicious cross-origin calls.`,
                    fixSteps: [
                        'Set Origin to http://localhost:3000 (the allowed origin)',
                        'Or: On a real server, add your origin to Access-Control-Allow-Origin',
                        'Or: Remove the custom header to avoid a preflight',
                    ],
                    commonMistakes: [
                        'Thinking CORS is a server-side security mechanism (it\'s browser-enforced)',
                        'Using Access-Control-Allow-Origin: * in production with credentials',
                        'Forgetting to handle OPTIONS requests on the server',
                    ],
                },
            };
        }

        // Origin is allowed but with preflight
        trace.push({
            stage: 'service',
            msg: 'Preflight passed! Server allows X-Custom header from localhost:3000',
            ok: true,
        });
        trace.push({ stage: 'db', msg: 'Actual request processed after preflight', ok: true });
        trace.push({ stage: 'response', msg: '200 OK with CORS headers', ok: true });

        return {
            http: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:3000',
                    'Access-Control-Allow-Headers': 'X-Custom, Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                },
                body: {
                    data: [{ id: 1, value: 'Hello from API' }],
                    note: 'This response includes CORS headers because a preflight was triggered by your custom header.',
                    preflightInfo: {
                        reason: 'Custom header X-Custom triggered preflight',
                        optionsResponse: {
                            'Access-Control-Allow-Origin': 'http://localhost:3000',
                            'Access-Control-Allow-Headers': 'X-Custom, Content-Type',
                        },
                    },
                },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'CORS Preflight Succeeded',
                explanation: 'Your request used a custom header (X-Custom), which is not a "simple" header. The browser first sends an OPTIONS preflight request to ask the server: "Do you allow this header from this origin?" The server responds with Access-Control-Allow-Headers including X-Custom, so the browser proceeds with the actual GET request.',
                fixSteps: [],
                commonMistakes: [
                    'Not configuring the server to respond to OPTIONS requests',
                    'Forgetting to list custom headers in Access-Control-Allow-Headers',
                    'Setting Access-Control-Max-Age too low, causing frequent preflight requests',
                ],
            },
        };
    }

    // Simple GET with Origin — no preflight needed
    if (origin !== 'http://localhost:3000') {
        trace.push({
            stage: 'auth',
            msg: `Checking CORS: Origin "${origin}" vs allowed origin "http://localhost:3000"`,
            highlight: { type: 'header', key: 'Origin' },
            ok: false,
        });
        return {
            http: {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
                body: { error: `CORS Error: Origin "${origin}" is not allowed by Access-Control-Allow-Origin.` },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'CORS Blocked — Wrong Origin',
                explanation: `The server only allows requests from http://localhost:3000, but your request came from "${origin}". The browser checks the Access-Control-Allow-Origin response header and blocks the response if your origin doesn't match.`,
                fixSteps: [
                    'Set Origin header to http://localhost:3000',
                    'In production, configure the server to allow your application\'s origin',
                ],
                commonMistakes: [
                    'Forgetting the protocol (http:// vs https://)',
                    'Including a trailing slash in the origin',
                    'Not understanding that CORS is enforced by the browser, not the server',
                ],
            },
        };
    }

    // Success — simple request from allowed origin
    trace.push({ stage: 'auth', msg: 'CORS check passed: Origin http://localhost:3000 is allowed', ok: true });
    trace.push({ stage: 'validation', msg: 'Simple GET request — no preflight needed', ok: true });
    trace.push({ stage: 'service', msg: 'Fetching data', ok: true });
    trace.push({ stage: 'db', msg: 'Data retrieved from store', ok: true });
    trace.push({ stage: 'response', msg: '200 OK with CORS headers', ok: true });

    return {
        http: {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:3000',
            },
            body: {
                data: [{ id: 1, value: 'Hello from API' }, { id: 2, value: 'CORS is working!' }],
                corsInfo: {
                    allowedOrigin: 'http://localhost:3000',
                    preflightRequired: false,
                    reason: 'Simple GET with only standard headers — no preflight needed',
                },
            },
            latencyMs: lat,
        },
        trace,
        teaching: {
            title: 'Simple CORS Request Succeeded',
            explanation: 'Your GET request from http://localhost:3000 succeeded because the server includes Access-Control-Allow-Origin: http://localhost:3000 in its response. Since you only used "simple" headers (Accept, Content-Type with standard values), no preflight OPTIONS request was needed.',
            fixSteps: [],
            commonMistakes: [
                'Thinking all cross-origin requests need a preflight (only "non-simple" ones do)',
                'Not understanding which headers/methods trigger a preflight',
            ],
        },
    };
}
