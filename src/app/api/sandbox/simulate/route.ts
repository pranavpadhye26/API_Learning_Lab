import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { SimulateResponse, TraceStep, TeachingPayload } from '@/lib/types';

// ─── Rate Limiting (in-memory, per-IP) ──────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;        // max requests
const RATE_WINDOW_MS = 60000; // per minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// ─── Input Validation ───────────────────────────────────────

const requestSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().min(1).max(500),
    headers: z.record(z.string().max(1000)).default({}),
    query: z.record(z.string().max(500)).default({}),
    body: z.string().max(10000).nullable().default(null),
    context: z.string().min(1).max(2000),
});

// ─── Input Sanitization ─────────────────────────────────────

function sanitize(input: string, maxLen: number = 500): string {
    return input
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
        .slice(0, maxLen)
        .trim();
}

function formatHeaders(headers: Record<string, string>): string {
    const entries = Object.entries(headers).slice(0, 20);
    if (entries.length === 0) return 'None';
    return entries.map(([k, v]) => `${sanitize(k, 100)}: ${sanitize(v, 200)}`).join('\n');
}

function formatQuery(query: Record<string, string>): string {
    const entries = Object.entries(query).slice(0, 20);
    if (entries.length === 0) return 'None';
    return entries.map(([k, v]) => `${sanitize(k, 100)}=${sanitize(v, 200)}`).join('&');
}

// ─── System Prompt Builder ──────────────────────────────────

function buildSystemPrompt(
    context: string,
    method: string,
    path: string,
    headers: Record<string, string>,
    query: Record<string, string>,
    body: string | null,
): string {
    return `You are an intelligent REST API server simulator for an educational platform called API Learning Lab. The user is learning how APIs work by sending HTTP requests to you.

You are simulating a: ${sanitize(context, 500)}

The user has sent the following HTTP request:
- Method: ${method}
- Path: ${sanitize(path, 500)}
- Headers: ${formatHeaders(headers)}
- Query Parameters: ${formatQuery(query)}
- Request Body: ${body ? sanitize(body, 5000) : 'None'}

You must respond with ONLY a valid JSON object (no markdown, no backticks, no explanation outside the JSON). Use this exact structure:

{
  "http": {
    "status": <number - appropriate HTTP status code>,
    "statusText": "<string - e.g. OK, Not Found, Created>",
    "headers": {
      "Content-Type": "application/json",
      <other relevant response headers>
    },
    "body": <valid JSON - the actual API response body, make it realistic with fake but believable data>
  },
  "trace": [
    { "stage": "client", "label": "<what happened at client stage>", "durationMs": <number> },
    { "stage": "auth", "label": "<what happened at auth stage>", "durationMs": <number> },
    { "stage": "validation", "label": "<what happened at validation stage>", "durationMs": <number> },
    { "stage": "service", "label": "<what happened at service/business logic stage>", "durationMs": <number> },
    { "stage": "database", "label": "<what happened at database stage>", "durationMs": <number> },
    { "stage": "response", "label": "<what happened at response stage>", "durationMs": <number> }
  ],
  "teaching": {
    "title": "<short title explaining what happened>",
    "explanation": "<2-3 paragraph explanation of what this request did, why the server responded this way, and what the user should learn from it>",
    "tips": ["<practical tip 1>", "<practical tip 2>", "<practical tip 3>"],
    "commonMistakes": ["<mistake 1>", "<mistake 2>"]
  }
}

Rules:
- Always return realistic, believable fake data (names, emails, IDs, timestamps)
- If the request is malformed, return the appropriate 4xx error with a helpful explanation
- If auth headers are missing and the endpoint would normally require auth, return 401
- If the method doesn't match the path (e.g., DELETE /api/users with no ID), return 405 or 400
- Match the trace stages to what actually happened — skip stages that don't apply (e.g., no "database" stage for a 401 auth failure — set label to "Skipped — request rejected before reaching DB")
- The teaching explanation should be educational and specific to what the user did, not generic
- Vary the response data — don't return the same users/items every time`;
}

// ─── JSON Extraction (bulletproof) ──────────────────────────

function extractJSON(raw: string): unknown | null {
    // Strategy 1: Direct parse
    try {
        return JSON.parse(raw);
    } catch { /* try next */ }

    // Strategy 2: Strip markdown fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
        try {
            return JSON.parse(fenceMatch[1]);
        } catch { /* try next */ }
    }

    // Strategy 3: Find outermost { ... } braces
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
        } catch { /* try next */ }
    }

    // Strategy 4: Strip leading/trailing non-JSON text line by line
    const lines = raw.split('\n');
    const jsonLines: string[] = [];
    let collecting = false;
    for (const line of lines) {
        if (!collecting && line.trim().startsWith('{')) collecting = true;
        if (collecting) jsonLines.push(line);
        if (collecting && line.trim().endsWith('}')) {
            try {
                return JSON.parse(jsonLines.join('\n'));
            } catch { /* keep collecting */ }
        }
    }

    return null;
}

// ─── LLM Response → SimulateResponse Adapter ────────────────

interface LLMTraceStep {
    stage: string;
    label: string;
    durationMs?: number;
}

interface LLMTeaching {
    title: string;
    explanation: string;
    tips?: string[];
    commonMistakes?: string[];
    fixSteps?: string[];
}

interface LLMResponse {
    http: {
        status: number;
        statusText?: string;
        headers: Record<string, string>;
        body: unknown;
    };
    trace: LLMTraceStep[];
    teaching: LLMTeaching;
}

function adaptToSimulateResponse(llm: LLMResponse): SimulateResponse {
    // Map LLM trace stages to existing TraceStep format
    const stageMap: Record<string, TraceStep['stage']> = {
        client: 'client',
        server: 'server',
        auth: 'auth',
        validation: 'validation',
        service: 'service',
        database: 'db',
        db: 'db',
        response: 'response',
    };

    const trace: TraceStep[] = llm.trace.map((t) => ({
        stage: stageMap[t.stage] || 'service',
        msg: t.label,
        ok: !t.label.toLowerCase().includes('skipped') &&
            !t.label.toLowerCase().includes('rejected') &&
            !t.label.toLowerCase().includes('failed') &&
            !t.label.toLowerCase().includes('error') &&
            !t.label.toLowerCase().includes('denied'),
    }));

    // Map LLM teaching → existing TeachingPayload
    const teaching: TeachingPayload = {
        title: llm.teaching.title || 'Response Explanation',
        explanation: llm.teaching.explanation || '',
        fixSteps: llm.teaching.tips || llm.teaching.fixSteps || [],
        commonMistakes: llm.teaching.commonMistakes || [],
    };

    // Calculate total latency from trace durations
    const totalLatency = llm.trace.reduce((sum, t) => sum + (t.durationMs || 0), 0);

    return {
        http: {
            status: llm.http.status,
            headers: llm.http.headers || { 'Content-Type': 'application/json' },
            body: llm.http.body,
            latencyMs: totalLatency || Math.floor(Math.random() * 100) + 50,
        },
        trace,
        teaching,
    };
}

// ─── Fallback Responses ─────────────────────────────────────

function fallbackResponse(status: number, message: string, explanation: string): SimulateResponse {
    return {
        http: {
            status,
            headers: { 'Content-Type': 'application/json' },
            body: { error: message },
            latencyMs: 0,
        },
        trace: [
            { stage: 'client', msg: 'Request sent', ok: true },
            { stage: 'server', msg: message, ok: false },
        ],
        teaching: {
            title: message,
            explanation,
            fixSteps: ['Check the AI backend connection and try again'],
            commonMistakes: [],
        },
    };
}

// ─── URL Validation ─────────────────────────────────────────

function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// ─── LLM Backend Abstraction ────────────────────────────────

type LLMBackend = 'gemini' | 'ollama';

function detectBackend(): { backend: LLMBackend; config: Record<string, string> } | { error: string } {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        return { backend: 'gemini', config: { apiKey: geminiKey, model } };
    }

    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    if (ollamaUrl) {
        if (!isValidUrl(ollamaUrl)) {
            return { error: 'OLLAMA_BASE_URL is invalid. It must start with http:// or https://.' };
        }
        const model = process.env.OLLAMA_MODEL || 'qwen3.5:cloud';
        return { backend: 'ollama', config: { url: ollamaUrl, model } };
    }

    return { error: 'No AI backend configured. Set GEMINI_API_KEY or OLLAMA_BASE_URL in .env.local.' };
}

async function callLLM(
    backend: LLMBackend,
    config: Record<string, string>,
    systemPrompt: string,
    userMessage: string,
    signal: AbortSignal,
): Promise<{ content: string } | { error: string; status: number }> {

    if (backend === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\n${userMessage}` }] },
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096,
                },
            }),
            signal,
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => 'Unknown error');
            console.error('Gemini error:', res.status, errText);
            return { error: `Gemini API returned error (${res.status}). Check your API key and model.`, status: res.status };
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || typeof text !== 'string') {
            return { error: 'Gemini returned an empty response.', status: 500 };
        }
        return { content: text };
    }

    // Ollama (OpenAI-compatible)
    const res = await fetch(`${config.url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.3,
            stream: false,
        }),
        signal,
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        console.error('Ollama error:', res.status, errText);
        return { error: `Ollama returned error (${res.status}). Check model name and server status.`, status: res.status };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') {
        return { error: 'Ollama returned an empty response.', status: 500 };
    }
    return { content: text };
}

// ─── Main Handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            fallbackResponse(429, 'Rate Limited', 'Too many requests. Please wait a moment before sending another request.'),
            { status: 429 }
        );
    }

    // Detect backend
    const backendResult = detectBackend();
    if ('error' in backendResult) {
        return NextResponse.json(
            fallbackResponse(503, 'AI Backend Not Configured', backendResult.error),
            { status: 503 }
        );
    }

    const { backend, config } = backendResult;

    try {
        // Parse and validate request body
        const raw = await request.json();
        const parsed = requestSchema.safeParse(raw);

        if (!parsed.success) {
            return NextResponse.json(
                fallbackResponse(400, 'Invalid Request', `The request was malformed: ${parsed.error.flatten().fieldErrors}`),
                { status: 400 }
            );
        }

        const { method, path, headers, query, body, context } = parsed.data;

        // Build prompt
        const systemPrompt = buildSystemPrompt(context, method, path, headers, query, body);
        const userMessage = `Simulate this ${method} ${sanitize(path, 200)} request and return the JSON response.`;

        // Call LLM with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        let llmResult: { content: string } | { error: string; status: number };
        try {
            llmResult = await callLLM(backend, config, systemPrompt, userMessage, controller.signal);
        } catch (fetchErr) {
            clearTimeout(timeout);
            const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
            return NextResponse.json(
                fallbackResponse(
                    503,
                    isAbort ? 'Request Timeout' : 'AI Backend Unavailable',
                    isAbort
                        ? 'The AI took too long to respond (>60s). Try a simpler request.'
                        : `Could not connect to ${backend === 'gemini' ? 'Gemini API' : 'Ollama'}. Check your configuration.`
                ),
                { status: 503 }
            );
        } finally {
            clearTimeout(timeout);
        }

        if ('error' in llmResult) {
            return NextResponse.json(
                fallbackResponse(503, 'AI Backend Error', llmResult.error),
                { status: 503 }
            );
        }

        // Extract and parse JSON from LLM output
        const extracted = extractJSON(llmResult.content);
        if (!extracted || typeof extracted !== 'object') {
            console.error('Failed to parse LLM JSON:', llmResult.content.slice(0, 500));
            return NextResponse.json(
                fallbackResponse(500, 'AI Response Parse Error', 'The AI response could not be parsed as JSON. Try again.'),
                { status: 500 }
            );
        }

        // Adapt LLM output to SimulateResponse
        const llmResponse = extracted as LLMResponse;

        if (!llmResponse.http || typeof llmResponse.http.status !== 'number') {
            return NextResponse.json(
                fallbackResponse(500, 'Malformed AI Response', 'The AI response was missing required fields. Try again.'),
                { status: 500 }
            );
        }

        // Ensure trace and teaching exist with defaults
        if (!Array.isArray(llmResponse.trace)) {
            llmResponse.trace = [
                { stage: 'client', label: 'Request sent', durationMs: 10 },
                { stage: 'response', label: `Returned ${llmResponse.http.status}`, durationMs: 5 },
            ];
        }
        if (!llmResponse.teaching || typeof llmResponse.teaching !== 'object') {
            llmResponse.teaching = {
                title: `${llmResponse.http.status} Response`,
                explanation: 'The AI generated a response but did not include a teaching explanation.',
                tips: [],
                commonMistakes: [],
            };
        }

        const simulateResponse = adaptToSimulateResponse(llmResponse);
        return NextResponse.json(simulateResponse);

    } catch (err) {
        console.error('Sandbox simulate error:', err);
        return NextResponse.json(
            fallbackResponse(500, 'Internal Server Error', 'An unexpected error occurred. Please try again.'),
            { status: 500 }
        );
    }
}

