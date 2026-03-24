'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SimulateResponse, HttpMethod } from '@/lib/types';
import type { SandboxHistoryEntry, APIContext } from '@/lib/sandbox-types';

interface RequestState {
    method: HttpMethod;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
}

interface SandboxState {
    context: APIContext;
    customContext: string;
    request: RequestState;
    response: SimulateResponse | null;
    isLoading: boolean;
    error: string | null;
    history: SandboxHistoryEntry[];
    setContext: (ctx: APIContext) => void;
    setCustomContext: (desc: string) => void;
    setRequest: (req: RequestState) => void;
    updateRequest: (partial: Partial<RequestState>) => void;
    sendRequest: () => Promise<void>;
    loadFromHistory: (entry: SandboxHistoryEntry) => void;
    clearHistory: () => void;
}

const STORAGE_KEY = 'api-lab-sandbox-history';
const MAX_HISTORY = 20;

function generateId(): string {
    return `sb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useSandboxState(): SandboxState {
    const [context, setContext] = useState<APIContext>('ecommerce');
    const [customContext, setCustomContext] = useState('');
    const [request, setRequest] = useState<RequestState>({
        method: 'GET',
        path: '/api/products',
        headers: {},
        query: {},
        body: '',
    });
    const [response, setResponse] = useState<SimulateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<SandboxHistoryEntry[]>([]);

    // Refs to avoid stale closures in callbacks
    const requestRef = useRef(request);
    const contextRef = useRef(context);
    const customContextRef = useRef(customContext);

    // Keep refs in sync with state
    useEffect(() => { requestRef.current = request; }, [request]);
    useEffect(() => { contextRef.current = context; }, [context]);
    useEffect(() => { customContextRef.current = customContext; }, [customContext]);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as SandboxHistoryEntry[];
                setHistory(parsed.slice(0, MAX_HISTORY));
            }
        } catch { /* ignore corrupt data */ }
    }, []);

    // Persist history helper — uses functional setState to avoid stale closure
    const addToHistory = useCallback((entry: SandboxHistoryEntry) => {
        setHistory(prev => {
            const updated = [entry, ...prev].slice(0, MAX_HISTORY);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch { /* storage full */ }
            return updated;
        });
    }, []);

    const updateRequest = useCallback((partial: Partial<RequestState>) => {
        setRequest(prev => ({ ...prev, ...partial }));
    }, []);

    // sendRequest reads from refs — stable identity, no stale data
    const sendRequest = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        // Read latest values from refs (not stale closure)
        const req = requestRef.current;
        const ctx = contextRef.current;
        const customCtx = customContextRef.current;

        try {
            const contextString = ctx === 'custom'
                ? (customCtx.trim() || 'A generic REST API')
                : ctx;

            const res = await fetch('/api/sandbox/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: req.method,
                    path: req.path,
                    headers: req.headers,
                    query: req.query,
                    body: req.body || null,
                    context: contextString,
                }),
            });

            const data: SimulateResponse = await res.json();
            setResponse(data);

            // Add to history using functional update (no stale history)
            addToHistory({
                id: generateId(),
                timestamp: Date.now(),
                method: req.method,
                path: req.path,
                status: data.http?.status || 0,
                context: contextString,
                request: {
                    method: req.method,
                    path: req.path,
                    headers: req.headers,
                    query: req.query,
                    body: req.body || null,
                    context: contextString,
                },
                response: data,
            });
        } catch (err) {
            console.error('Sandbox request failed:', err);
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);

            setResponse({
                http: {
                    status: 0,
                    headers: {},
                    body: { error: 'Network error — could not reach the sandbox API.' },
                    latencyMs: 0,
                },
                trace: [{ stage: 'client', msg: 'Failed to reach sandbox endpoint', ok: false }],
                teaching: {
                    title: 'Network Error',
                    explanation: 'The request could not be sent. Make sure the dev server is running.',
                    fixSteps: ['Check that the dev server is running with npm run dev'],
                    commonMistakes: [],
                },
            });
        } finally {
            setIsLoading(false);
        }
    }, [addToHistory]); // stable deps — no state in closure

    const loadFromHistory = useCallback((entry: SandboxHistoryEntry) => {
        setRequest({
            method: entry.request.method as HttpMethod,
            path: entry.request.path,
            headers: entry.request.headers,
            query: entry.request.query,
            body: entry.request.body || '',
        });
        setResponse(entry.response);
        setError(null);
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
    }, []);

    return {
        context,
        customContext,
        request,
        response,
        isLoading,
        error,
        history,
        setContext,
        setCustomContext,
        setRequest,
        updateRequest,
        sendRequest,
        loadFromHistory,
        clearHistory,
    };
}
