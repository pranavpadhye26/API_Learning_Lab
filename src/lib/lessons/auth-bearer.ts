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

export function handleAuthBearer(req: RequestInput): SimulateResponse {
    const trace: TraceStep[] = [];
    const lat = latency(req);

    trace.push({ stage: 'client', msg: `Browser sends ${req.method} request to ${req.path}`, ok: true });
    trace.push({ stage: 'server', msg: `Server receives ${req.method} ${req.path}`, ok: true });

    // Public endpoint
    if (req.path === '/public') {
        if (req.method !== 'GET') {
            trace.push({ stage: 'server', msg: `Method ${req.method} not allowed on /public — only GET is supported`, ok: false });
            return {
                http: { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET' }, body: { error: `Method ${req.method} not allowed on /public. Use GET.` }, latencyMs: lat },
                trace,
                teaching: {
                    title: '405 Method Not Allowed',
                    explanation: `The /public endpoint is read-only and only accepts GET requests. You sent ${req.method}. Public endpoints typically serve informational data that doesn't change.`,
                    fixSteps: ['Change the method to GET'],
                    commonMistakes: ['Trying to POST to a read-only endpoint'],
                },
            };
        }
        trace.push({ stage: 'auth', msg: 'Public endpoint — no authentication needed', ok: true });
        trace.push({ stage: 'validation', msg: 'No validation needed', ok: true });
        trace.push({ stage: 'service', msg: 'Fetching public data', ok: true });
        trace.push({ stage: 'db', msg: 'Query executed', ok: true });
        trace.push({ stage: 'response', msg: 'Returning 200 OK', ok: true });

        return {
            http: {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { message: 'Welcome! This is a public endpoint. No authentication required.', timestamp: new Date().toISOString() },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Public Endpoint',
                explanation: 'This endpoint is publicly accessible without any authentication. Not all endpoints require tokens — public APIs like weather data or documentation are often open.',
                fixSteps: [],
                commonMistakes: ['Assuming all endpoints require authentication'],
            },
        };
    }

    // Login endpoint
    if (req.path === '/login') {
        if (req.method !== 'POST') {
            trace.push({ stage: 'server', msg: `Method ${req.method} not allowed on /login — only POST is supported`, ok: false });
            return {
                http: { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }, body: { error: `Method ${req.method} not allowed on /login. Use POST with credentials.` }, latencyMs: lat },
                trace,
                teaching: {
                    title: '405 Method Not Allowed',
                    explanation: `The /login endpoint only accepts POST requests because login submits sensitive credentials in the request body. You sent ${req.method}. GET requests would expose credentials in the URL, which is a security risk.`,
                    fixSteps: ['Change the method to POST', 'Include {"username": "...", "password": "..."} in the body'],
                    commonMistakes: ['Using GET for login (credentials would appear in URL and server logs)', 'Sending credentials as query parameters'],
                },
            };
        }
        trace.push({ stage: 'auth', msg: 'Login endpoint — accepting credentials', ok: true });

        let parsed: Record<string, unknown> = {};
        try {
            parsed = JSON.parse(req.body || '{}');
        } catch {
            // ignore
        }

        if (!parsed.username || !parsed.password) {
            trace.push({ stage: 'validation', msg: 'Missing username or password in body', highlight: { type: 'body' }, ok: false });
            return {
                http: { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'username and password are required' }, latencyMs: lat },
                trace,
                teaching: {
                    title: 'Missing Credentials',
                    explanation: 'Login endpoints expect a JSON body with username and password fields.',
                    fixSteps: ['Include {"username": "...", "password": "..."} in the request body'],
                    commonMistakes: ['Sending empty body', 'Using query params instead of body for credentials'],
                },
            };
        }

        trace.push({ stage: 'validation', msg: 'Credentials received', ok: true });
        trace.push({ stage: 'service', msg: 'Verifying credentials against user store', ok: true });
        trace.push({ stage: 'db', msg: 'User found, generating token', ok: true });
        trace.push({ stage: 'response', msg: 'Returning token', ok: true });

        return {
            http: {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { token: 'demo-token', expiresIn: 3600 },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Login Successful',
                explanation: 'The server verified your credentials and returned a bearer token. Store this token and include it in the Authorization header for subsequent requests to protected endpoints: Authorization: Bearer demo-token',
                fixSteps: [],
                commonMistakes: ['Storing tokens in localStorage in production (use httpOnly cookies)', 'Forgetting to refresh tokens before they expire'],
            },
        };
    }

    // Profile endpoint — requires auth
    if (req.path === '/profile') {
        if (req.method !== 'GET') {
            trace.push({ stage: 'server', msg: `Method ${req.method} not allowed on /profile — only GET is supported`, ok: false });
            return {
                http: { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET' }, body: { error: `Method ${req.method} not allowed on /profile. Use GET with a Bearer token.` }, latencyMs: lat },
                trace,
                teaching: {
                    title: '405 Method Not Allowed',
                    explanation: `The /profile endpoint only accepts GET requests to retrieve the authenticated user's profile. You sent ${req.method}. To update a profile, a real API would typically use PUT or PATCH on this endpoint.`,
                    fixSteps: ['Change the method to GET', 'Include the Authorization: Bearer demo-token header'],
                    commonMistakes: ['Using POST to read profile data', 'Forgetting the Authorization header'],
                },
            };
        }
        const authHeader = req.headers['Authorization'] || req.headers['authorization'] || '';

        if (!authHeader) {
            trace.push({
                stage: 'auth',
                msg: 'No Authorization header found',
                highlight: { type: 'header', key: 'Authorization' },
                ok: false,
            });
            return {
                http: {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' },
                    body: { error: 'Unauthorized. No Authorization header provided.' },
                    latencyMs: lat,
                },
                trace,
                teaching: {
                    title: 'Missing Authorization Header',
                    explanation: 'This endpoint requires a bearer token. You need to include an Authorization header with the format: Bearer <your-token>. Tokens are typically obtained from a login endpoint.',
                    fixSteps: [
                        'Add header: Authorization: Bearer demo-token',
                        'First call POST /login to get a token if you don\'t have one',
                    ],
                    commonMistakes: [
                        'Forgetting the Authorization header entirely',
                        'Misspelling "Authorization" (British: Authorisation)',
                        'Not including the "Bearer " prefix before the token',
                    ],
                },
            };
        }

        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (token !== 'demo-token') {
            trace.push({
                stage: 'auth',
                msg: `Invalid token: "${token}" — expected "demo-token"`,
                highlight: { type: 'header', key: 'Authorization' },
                ok: false,
            });
            return {
                http: {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer error="invalid_token"' },
                    body: { error: 'Unauthorized. Invalid or expired token.' },
                    latencyMs: lat,
                },
                trace,
                teaching: {
                    title: 'Invalid Token',
                    explanation: 'The token you provided is not valid. In real APIs, this could mean the token has expired, been revoked, or was never issued by this server. For this demo, use "demo-token".',
                    fixSteps: [
                        'Use the correct token: Bearer demo-token',
                        'Call POST /login to get a fresh token',
                    ],
                    commonMistakes: [
                        'Using an expired token',
                        'Copying the token with extra whitespace',
                        'Including the quotes around the token value',
                    ],
                },
            };
        }

        trace.push({ stage: 'auth', msg: 'Bearer token verified successfully', ok: true });
        trace.push({ stage: 'validation', msg: 'Request validated', ok: true });
        trace.push({ stage: 'service', msg: 'Fetching user profile from token claims', ok: true });
        trace.push({ stage: 'db', msg: 'User profile loaded', ok: true });
        trace.push({ stage: 'response', msg: 'Returning 200 OK with profile', ok: true });

        return {
            http: {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    id: 42,
                    name: 'Demo User',
                    email: 'demo@example.com',
                    role: 'developer',
                    plan: 'pro',
                    createdAt: '2024-01-15T10:30:00Z',
                },
                latencyMs: lat,
            },
            trace,
            teaching: {
                title: 'Authenticated Request Successful',
                explanation: 'Your bearer token was valid and the server returned your profile. The token acts as proof of identity — the server decoded it to find your user ID and loaded your data.',
                fixSteps: [],
                commonMistakes: ['Logging tokens in client-side code', 'Not handling 401 responses to redirect to login'],
            },
        };
    }

    // Unknown path
    trace.push({ stage: 'server', msg: `Unknown path: ${req.path}`, ok: false });
    return {
        http: { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Not found' }, latencyMs: lat },
        trace,
        teaching: {
            title: 'Endpoint Not Found',
            explanation: 'This lesson supports /public, /profile, and /login endpoints.',
            fixSteps: ['Use one of: /public, /profile, /login'],
            commonMistakes: ['Typos in the endpoint path'],
        },
    };
}
