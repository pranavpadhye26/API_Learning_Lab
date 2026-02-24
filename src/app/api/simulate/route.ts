import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleGetQueryBasics } from '@/lib/lessons/get-query-basics';
import { handlePostJsonValidation } from '@/lib/lessons/post-json-validation';
import { handleAuthBearer } from '@/lib/lessons/auth-bearer';
import { handlePaginationFiltering } from '@/lib/lessons/pagination-filtering';
import { handleCorsPreflight } from '@/lib/lessons/cors-preflight';
import { SimulateResponse } from '@/lib/types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const requestSchema = z.object({
    lessonId: z.string().min(1),
    request: z.object({
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        path: z.string().min(1),
        headers: z.record(z.string()),
        query: z.record(z.string()),
        body: z.string(),
    }),
});

type Handler = (req: { method: string; path: string; headers: Record<string, string>; query: Record<string, string>; body: string }) => SimulateResponse;

const handlers: Record<string, Handler> = {
    'get-query-basics': handleGetQueryBasics,
    'post-json-validation': handlePostJsonValidation,
    'auth-bearer': handleAuthBearer,
    'pagination-filtering': handlePaginationFiltering,
    'cors-preflight': handleCorsPreflight,
};

export async function POST(request: NextRequest) {
    try {
        const raw = await request.json();
        const parsed = requestSchema.safeParse(raw);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { lessonId, request: simReq } = parsed.data;
        const handler = handlers[lessonId];

        if (!handler) {
            return NextResponse.json(
                { error: `Unknown lesson ID: ${lessonId}` },
                { status: 404 }
            );
        }

        const result = handler(simReq);
        await sleep(result.http.latencyMs);
        return NextResponse.json(result);
    } catch (err) {
        console.error('Simulate error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
