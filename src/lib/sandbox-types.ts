import type { SimulateResponse } from './types';

// ─── API Context ────────────────────────────────────────────

export type APIContext =
    | 'ecommerce'
    | 'social'
    | 'banking'
    | 'healthcare'
    | 'saas'
    | 'iot'
    | 'custom';

export interface APIContextOption {
    value: APIContext;
    label: string;
    description: string;
    icon: string;
}

// ─── Sandbox Request / Response ─────────────────────────────

export interface SandboxRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string | null;
    context: string;
}

export interface SandboxHistoryEntry {
    id: string;
    timestamp: number;
    method: string;
    path: string;
    status: number;
    context: string;
    request: SandboxRequest;
    response: SimulateResponse;
}

// ─── Quick-Start Suggestion ─────────────────────────────────

export interface SandboxSuggestion {
    method: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
    label: string;
}
