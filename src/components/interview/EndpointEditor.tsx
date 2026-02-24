'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserEndpoint } from '@/lib/interview-types';
import type { HttpMethod } from '@/lib/types';

interface Props {
    endpoint: UserEndpoint;
    onUpdate: (updates: Partial<UserEndpoint>) => void;
    onRemove: () => void;
    index: number;
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    POST: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PUT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PATCH: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const METHOD_HINTS: Record<string, string> = {
    GET: 'Retrieve data — does not change anything on the server',
    POST: 'Create a new resource — sends data in the request body',
    PUT: 'Replace an entire resource — must send all fields',
    PATCH: 'Update part of a resource — send only changed fields',
    DELETE: 'Remove a resource permanently',
};

// Common status codes with human-readable labels
const COMMON_STATUS_CODES: { code: number; label: string; color: string }[] = [
    { code: 200, label: '200 — OK (success)', color: 'text-emerald-400' },
    { code: 201, label: '201 — Created (new resource made)', color: 'text-emerald-400' },
    { code: 204, label: '204 — No Content (success, nothing to return)', color: 'text-emerald-400' },
    { code: 400, label: '400 — Bad Request (invalid input)', color: 'text-amber-400' },
    { code: 401, label: '401 — Unauthorized (no auth token)', color: 'text-amber-400' },
    { code: 403, label: '403 — Forbidden (not allowed)', color: 'text-amber-400' },
    { code: 404, label: '404 — Not Found (resource doesn\'t exist)', color: 'text-amber-400' },
    { code: 409, label: '409 — Conflict (e.g., duplicate entry)', color: 'text-amber-400' },
    { code: 422, label: '422 — Unprocessable (validation failed)', color: 'text-amber-400' },
    { code: 500, label: '500 — Server Error (something broke)', color: 'text-red-400' },
];

/** Small hint text below a field label */
function Hint({ text }: { text: string }) {
    return <p className="text-[10px] text-[var(--text-muted)] mt-0.5 mb-1.5 leading-relaxed opacity-70">{text}</p>;
}

function FieldLabel({ label, children }: { label: string; children?: React.ReactNode }) {
    return (
        <div className="flex items-baseline gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">{label}</label>
            {children}
        </div>
    );
}

export default function EndpointEditor({ endpoint, onUpdate, onRemove, index }: Props) {
    const [expanded, setExpanded] = useState(index === 0);
    const [errorInput, setErrorInput] = useState('');
    const [paramInput, setParamInput] = useState('');
    const [headerInput, setHeaderInput] = useState('');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);

    const addToStringList = (field: 'errorCases' | 'queryParams' | 'headers', val: string) => {
        if (val.trim() && !endpoint[field].includes(val.trim())) {
            onUpdate({ [field]: [...endpoint[field], val.trim()] });
        }
    };

    const toggleStatusCode = (code: number) => {
        if (endpoint.statusCodes.includes(code)) {
            onUpdate({ statusCodes: endpoint.statusCodes.filter(c => c !== code) });
        } else {
            onUpdate({ statusCodes: [...endpoint.statusCodes, code].sort((a, b) => a - b) });
        }
    };

    // Smart placeholder for path based on method
    const pathPlaceholder = (() => {
        switch (endpoint.method) {
            case 'GET': return '/todos or /todos/:id';
            case 'POST': return '/todos';
            case 'PUT': case 'PATCH': return '/todos/:id';
            case 'DELETE': return '/todos/:id';
            default: return '/resource';
        }
    })();

    // Smart description placeholder
    const descPlaceholder = (() => {
        switch (endpoint.method) {
            case 'GET': return 'e.g., List all todos with pagination, or Get a single todo by ID';
            case 'POST': return 'e.g., Create a new todo item';
            case 'PUT': return 'e.g., Replace a todo item with new data';
            case 'PATCH': return 'e.g., Update the status of a todo';
            case 'DELETE': return 'e.g., Delete a todo by ID';
            default: return 'What does this endpoint do?';
        }
    })();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
        >
            {/* Collapsed Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-hover)]/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${METHOD_COLORS[endpoint.method] || ''}`}>
                    {endpoint.method}
                </span>
                <span className="text-sm font-mono text-[var(--text-primary)] flex-1 truncate">
                    {endpoint.path || '/...'}
                </span>
                <span className="text-xs text-[var(--text-muted)] max-w-[200px] truncate">{endpoint.description}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors ml-2"
                >✕</button>
                <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="text-xs text-[var(--text-muted)]">▶</motion.span>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--border)] overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-4">
                            {/* ── Method + Path ── */}
                            <div className="grid grid-cols-[140px_1fr] gap-3">
                                <div>
                                    <FieldLabel label="Method" />
                                    <Hint text="What action is this endpoint performing?" />
                                    <select
                                        value={endpoint.method}
                                        onChange={e => onUpdate({ method: e.target.value as HttpMethod })}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                                    >
                                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <p className="text-[9px] text-violet-400/70 mt-1 leading-snug">{METHOD_HINTS[endpoint.method]}</p>
                                </div>
                                <div>
                                    <FieldLabel label="Path" />
                                    <Hint text="The URL route. Use plural nouns (/todos not /todo). Use /:id for single-item endpoints." />
                                    <input
                                        type="text"
                                        value={endpoint.path}
                                        onChange={e => onUpdate({ path: e.target.value })}
                                        placeholder={pathPlaceholder}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>

                            {/* ── Description ── */}
                            <div>
                                <FieldLabel label="Description" />
                                <Hint text="A short sentence explaining what this endpoint does." />
                                <input
                                    type="text"
                                    value={endpoint.description}
                                    onChange={e => onUpdate({ description: e.target.value })}
                                    placeholder={descPlaceholder}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                                />
                            </div>

                            {/* ── Query Params + Headers ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Query Params */}
                                <div>
                                    <FieldLabel label="Query Parameters" />
                                    <Hint text="URL parameters for filtering, sorting, or pagination. Example: page, limit, status" />
                                    <div className="flex gap-1 mb-1 flex-wrap">
                                        {endpoint.queryParams.map((p, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 text-[11px]">
                                                {p}
                                                <button onClick={() => onUpdate({ queryParams: endpoint.queryParams.filter((_, j) => j !== i) })} className="hover:text-red-400">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <input
                                            type="text" value={paramInput} onChange={e => setParamInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { addToStringList('queryParams', paramInput); setParamInput(''); } }}
                                            placeholder="e.g., page"
                                            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)]"
                                        />
                                        <button onClick={() => { addToStringList('queryParams', paramInput); setParamInput(''); }} className="text-xs text-violet-400 px-2">+</button>
                                    </div>
                                </div>

                                {/* Headers */}
                                <div>
                                    <FieldLabel label="Required Headers" />
                                    <Hint text="Headers the client must include. Content-Type for POST/PUT, Authorization for protected routes." />
                                    <div className="flex gap-1 mb-1 flex-wrap">
                                        {endpoint.headers.map((h, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[11px]">
                                                {h}
                                                <button onClick={() => onUpdate({ headers: endpoint.headers.filter((_, j) => j !== i) })} className="hover:text-red-400">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <input
                                            type="text" value={headerInput} onChange={e => setHeaderInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { addToStringList('headers', headerInput); setHeaderInput(''); } }}
                                            placeholder="e.g., Content-Type"
                                            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)]"
                                        />
                                        <button onClick={() => { addToStringList('headers', headerInput); setHeaderInput(''); }} className="text-xs text-amber-400 px-2">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Request/Response Bodies ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Request Body — only shown for POST/PUT/PATCH */}
                                <div>
                                    <FieldLabel label="Request Body (JSON)" />
                                    {hasBody ? (
                                        <>
                                            <Hint text="The JSON shape the client sends. Use types like &quot;string&quot; for values to describe the schema." />
                                            <textarea
                                                value={endpoint.requestBody}
                                                onChange={e => onUpdate({ requestBody: e.target.value })}
                                                placeholder={'{\n  "title": "string",\n  "description": "string"\n}'}
                                                rows={4}
                                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text-primary)] resize-y"
                                            />
                                        </>
                                    ) : (
                                        <div className="bg-[var(--bg)]/50 border border-dashed border-[var(--border)] rounded-lg px-3 py-4 mt-1">
                                            <p className="text-[10px] text-[var(--text-muted)] text-center">
                                                {endpoint.method} requests don&apos;t have a body — data is sent via URL and query params.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Response Body */}
                                <div>
                                    <FieldLabel label="Response Body (JSON)" />
                                    <Hint text="What the server sends back on success. Use types like &quot;string&quot; to show the shape." />
                                    <textarea
                                        value={endpoint.responseBody}
                                        onChange={e => onUpdate({ responseBody: e.target.value })}
                                        placeholder={'{\n  "id": "string",\n  "title": "string",\n  "createdAt": "ISO8601"\n}'}
                                        rows={4}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text-primary)] resize-y"
                                    />
                                </div>
                            </div>

                            {/* ── Status Codes (clickable picker) + Error Cases ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status Codes */}
                                <div>
                                    <FieldLabel label="Status Codes" />
                                    <Hint text="Click to add/remove. Green = success, Amber = client error, Red = server error." />

                                    {/* Current selections */}
                                    <div className="flex gap-1 mb-2 flex-wrap">
                                        {endpoint.statusCodes.length === 0 && (
                                            <span className="text-[10px] text-[var(--text-muted)] italic">None selected — click below to add</span>
                                        )}
                                        {endpoint.statusCodes.map((code) => (
                                            <button
                                                key={code}
                                                onClick={() => toggleStatusCode(code)}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${code < 300 ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : code < 500 ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' : 'bg-red-500/15 text-red-300 hover:bg-red-500/25'}`}
                                            >
                                                {code} ✕
                                            </button>
                                        ))}
                                    </div>

                                    {/* Picker toggle */}
                                    <button
                                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                        className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                                    >
                                        {statusDropdownOpen ? '▾ Hide codes' : '▸ Choose status codes'}
                                    </button>

                                    <AnimatePresence>
                                        {statusDropdownOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-2 space-y-0.5">
                                                    {COMMON_STATUS_CODES.map(({ code, label, color }) => {
                                                        const selected = endpoint.statusCodes.includes(code);
                                                        return (
                                                            <button
                                                                key={code}
                                                                onClick={() => toggleStatusCode(code)}
                                                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all flex items-center gap-2 ${selected
                                                                    ? 'bg-violet-500/15 text-[var(--text-primary)]'
                                                                    : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                                                                    }`}
                                                            >
                                                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] ${selected ? 'bg-violet-500 border-violet-500 text-white' : 'border-[var(--border)]'}`}>
                                                                    {selected && '✓'}
                                                                </span>
                                                                <span className={color}>{label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Error Cases */}
                                <div>
                                    <FieldLabel label="Error Cases" />
                                    <Hint text="What can go wrong? Think about missing fields, invalid values, and not-found resources." />
                                    <div className="flex gap-1 mb-1 flex-wrap">
                                        {endpoint.errorCases.map((ec, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-[11px] max-w-full">
                                                <span className="truncate">{ec}</span>
                                                <button onClick={() => onUpdate({ errorCases: endpoint.errorCases.filter((_, j) => j !== i) })} className="hover:text-red-400 flex-shrink-0">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <input
                                            type="text" value={errorInput} onChange={e => setErrorInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { addToStringList('errorCases', errorInput); setErrorInput(''); } }}
                                            placeholder="e.g., Missing required title field"
                                            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)]"
                                        />
                                        <button onClick={() => { addToStringList('errorCases', errorInput); setErrorInput(''); }} className="text-xs text-red-400 px-2">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
