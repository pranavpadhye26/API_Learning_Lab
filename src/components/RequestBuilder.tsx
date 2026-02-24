'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import KeyValueEditor, { createPair } from './KeyValueEditor';
import CodeGenTabs from './CodeGenTabs';
import type { HttpMethod, LessonMeta, BreakItMistake, TraceStep } from '@/lib/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
    method: HttpMethod;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
    loading: boolean;
    breakItOn: boolean;
    activeLesson: LessonMeta | null;
    highlights?: TraceStep['highlight'][];
    onUpdateRequest: (partial: { method?: HttpMethod; path?: string; headers?: Record<string, string>; query?: Record<string, string>; body?: string }) => void;
    onSend: () => void;
    onBreakItToggle: (on: boolean) => void;
}

const ALL_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    POST: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    PUT: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    PATCH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    DELETE: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const HEADER_PRESETS = [
    { label: 'Authorization', key: 'Authorization', value: 'Bearer demo-token' },
    { label: 'Content-Type', key: 'Content-Type', value: 'application/json' },
    { label: 'Accept', key: 'Accept', value: 'application/json' },
];

type Section = 'query' | 'headers' | 'body' | 'codegen';

export default function RequestBuilder({
    method, path, headers, query, body, loading, breakItOn, activeLesson, highlights,
    onUpdateRequest, onSend, onBreakItToggle,
}: Props) {
    const [openSections, setOpenSections] = useState<Set<Section>>(new Set(['query', 'headers']));
    const [breakItTooltip, setBreakItTooltip] = useState<string | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [bodyHighlight, setBodyHighlight] = useState(false);

    // Derive allowed methods from lesson data
    const allowedMethods = useMemo(
        () => activeLesson?.allowedMethods ?? ALL_METHODS,
        [activeLesson]
    );

    // Auto-reset method when switching lessons if current method is not allowed
    useEffect(() => {
        if (activeLesson && !allowedMethods.includes(method)) {
            onUpdateRequest({ method: activeLesson.defaultRequest.method });
        }
    }, [activeLesson, allowedMethods]); // eslint-disable-line react-hooks/exhaustive-deps

    // Extract highlighted keys for query and header editors
    const highlightedQueryKeys = useMemo(() => {
        if (!highlights) return [];
        return highlights.filter(h => h?.type === 'query' && h.key).map(h => h!.key!);
    }, [highlights]);

    const highlightedHeaderKeys = useMemo(() => {
        if (!highlights) return [];
        return highlights.filter(h => h?.type === 'header' && h.key).map(h => h!.key!);
    }, [highlights]);

    // Body highlight with auto-fade
    useEffect(() => {
        const hasBodyHighlight = highlights?.some(h => h?.type === 'body');
        if (hasBodyHighlight) {
            setBodyHighlight(true);
            const timer = setTimeout(() => setBodyHighlight(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setBodyHighlight(false);
        }
    }, [highlights]);

    const toggleSection = (s: Section) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(s)) next.delete(s); else next.add(s);
            return next;
        });
    };

    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

    // Stable ID maps — persist IDs across re-renders for the same keys
    const headerIdMapRef = useRef<Map<string, string>>(new Map());
    const queryIdMapRef = useRef<Map<string, string>>(new Map());
    // Track extra empty-key rows being typed into
    const [extraHeaderRows, setExtraHeaderRows] = useState<{ id: string; key: string; value: string }[]>([]);
    const [extraQueryRows, setExtraQueryRows] = useState<{ id: string; key: string; value: string }[]>([]);

    const headersArray = useMemo(() => {
        const map = headerIdMapRef.current;
        const result = Object.entries(headers).map(([key, value]) => {
            if (!map.has(key)) map.set(key, createPair(key, value).id);
            return { id: map.get(key)!, key, value };
        });
        // Clean stale keys from map
        const currentKeys = new Set(Object.keys(headers));
        for (const k of map.keys()) { if (!currentKeys.has(k)) map.delete(k); }
        return [...result, ...extraHeaderRows];
    }, [headers, extraHeaderRows]);

    const queryArray = useMemo(() => {
        const map = queryIdMapRef.current;
        const result = Object.entries(query).map(([key, value]) => {
            if (!map.has(key)) map.set(key, createPair(key, value).id);
            return { id: map.get(key)!, key, value };
        });
        const currentKeys = new Set(Object.keys(query));
        for (const k of map.keys()) { if (!currentKeys.has(k)) map.delete(k); }
        return [...result, ...extraQueryRows];
    }, [query, extraQueryRows]);

    const handleHeadersChange = useCallback((pairs: { id: string; key: string; value: string }[]) => {
        const obj: Record<string, string> = {};
        const empties: { id: string; key: string; value: string }[] = [];
        pairs.forEach(p => {
            if (p.key.trim()) {
                obj[p.key] = p.value;
                headerIdMapRef.current.set(p.key, p.id);
            } else {
                empties.push(p);
            }
        });
        setExtraHeaderRows(empties);
        onUpdateRequest({ headers: obj });
    }, [onUpdateRequest]);

    const handleQueryChange = useCallback((pairs: { id: string; key: string; value: string }[]) => {
        const obj: Record<string, string> = {};
        const empties: { id: string; key: string; value: string }[] = [];
        pairs.forEach(p => {
            if (p.key.trim()) {
                obj[p.key] = p.value;
                queryIdMapRef.current.set(p.key, p.id);
            } else {
                empties.push(p);
            }
        });
        setExtraQueryRows(empties);
        onUpdateRequest({ query: obj });
    }, [onUpdateRequest]);

    const handleBreakIt = useCallback(() => {
        if (!breakItOn && activeLesson?.breakItMistakes?.length) {
            // Pick a random mistake
            const mistake: BreakItMistake = activeLesson.breakItMistakes[Math.floor(Math.random() * activeLesson.breakItMistakes.length)];
            const update: Partial<{ method: HttpMethod; path: string; headers: Record<string, string>; query: Record<string, string>; body: string }> = {};

            if (mistake.apply.setHeader) {
                update.headers = { ...headers, ...mistake.apply.setHeader };
            }
            if (mistake.apply.removeHeader) {
                const h = { ...headers };
                delete h[mistake.apply.removeHeader];
                update.headers = h;
            }
            if (mistake.apply.setBody !== undefined) {
                update.body = mistake.apply.setBody;
            }
            if (mistake.apply.setQuery) {
                update.query = mistake.apply.setQuery;
            }
            if (mistake.apply.setMethod) {
                // Only apply if the method is in allowedMethods, otherwise skip
                if (allowedMethods.includes(mistake.apply.setMethod)) {
                    update.method = mistake.apply.setMethod;
                }
            }

            onUpdateRequest(update);
            setBreakItTooltip(mistake.tooltip);
            onBreakItToggle(true);
            setTimeout(() => setBreakItTooltip(null), 4000);
        } else {
            // Toggle off — restore defaults
            if (activeLesson) {
                onUpdateRequest({ ...activeLesson.defaultRequest });
            }
            onBreakItToggle(false);
            setBreakItTooltip(null);
        }
    }, [breakItOn, activeLesson, headers, onUpdateRequest, onBreakItToggle]);

    const handleSend = useCallback(() => {
        if (hasBody && body.trim()) {
            try {
                JSON.parse(body);
                setJsonError(null);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Invalid JSON';
                setJsonError(msg);
                return;
            }
        } else {
            setJsonError(null);
        }
        onSend();
    }, [hasBody, body, onSend]);

    return (
        <div data-tour="request-builder" className="bg-[var(--surface)] rounded-xl border border-[var(--border)] flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Request Builder</span>
                </div>

                {/* Method + Path */}
                <div className="flex gap-2">
                    <select
                        value={method}
                        onChange={(e) => onUpdateRequest({ method: e.target.value as HttpMethod })}
                        className={`px-2 py-2 text-xs font-bold rounded-lg border cursor-pointer ${METHOD_COLORS[method]} bg-transparent focus:outline-none`}
                    >
                        {allowedMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                        type="text"
                        value={path}
                        onChange={(e) => onUpdateRequest({ path: e.target.value })}
                        placeholder="/endpoint"
                        className="flex-1 px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg 
                       text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)]
                       focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Query Params */}
                <SectionToggle label="Query Parameters" count={queryArray.length} open={openSections.has('query')} onToggle={() => toggleSection('query')} />
                <AnimatePresence>
                    {openSections.has('query') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <KeyValueEditor
                                pairs={queryArray}
                                onChange={handleQueryChange}
                                placeholder={{ key: 'param', value: 'value' }}
                                highlightKeys={highlightedQueryKeys}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Headers */}
                <SectionToggle label="Headers" count={headersArray.length} open={openSections.has('headers')} onToggle={() => toggleSection('headers')} />
                <AnimatePresence>
                    {openSections.has('headers') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <KeyValueEditor
                                pairs={headersArray}
                                onChange={handleHeadersChange}
                                presets={HEADER_PRESETS}
                                placeholder={{ key: 'Header-Name', value: 'value' }}
                                highlightKeys={highlightedHeaderKeys}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Body */}
                {hasBody && (
                    <>
                        <SectionToggle label="JSON Body" open={openSections.has('body')} onToggle={() => toggleSection('body')} />
                        <AnimatePresence>
                            {openSections.has('body') && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <div className={`border rounded-lg overflow-hidden transition-all ${bodyHighlight ? 'highlight-pulse ring-1 ring-amber-400/60 border-amber-500/40' : 'border-[var(--border)]'}`}>
                                        <MonacoEditor
                                            height="140px"
                                            language="json"
                                            value={body}
                                            onChange={(v) => {
                                                onUpdateRequest({ body: v || '' });
                                                setJsonError(null);
                                            }}
                                            theme="vs-dark"
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 12,
                                                lineNumbers: 'off',
                                                scrollBeyondLastLine: false,
                                                padding: { top: 8 },
                                                renderLineHighlight: 'none',
                                                overviewRulerBorder: false,
                                                folding: false,
                                                wordWrap: 'on',
                                            }}
                                        />
                                    </div>
                                    {jsonError && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[11px] text-red-400 mt-1 px-1"
                                        >
                                            ⚠ {jsonError}
                                        </motion.p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* Code Generation */}
                <SectionToggle label="Code Generation" open={openSections.has('codegen')} onToggle={() => toggleSection('codegen')} />
                <AnimatePresence>
                    {openSections.has('codegen') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <CodeGenTabs method={method} path={path} headers={headers} query={query} body={body} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer: Send + Break-it */}
            <div className="p-4 border-t border-[var(--border)]">
                {/* Break-it tooltip */}
                <AnimatePresence>
                    {breakItTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300"
                        >
                            💥 {breakItTooltip}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2 items-center">
                    <motion.button
                        data-tour="send-button"
                        onClick={handleSend}
                        disabled={loading}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
              ${loading
                                ? 'bg-violet-600/30 text-violet-300/50 cursor-wait'
                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
                            }`}
                        whileHover={!loading ? { scale: 1.01 } : {}}
                        whileTap={!loading ? { scale: 0.99 } : {}}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span>
                                Sending...
                            </span>
                        ) : '▶ Send Request'}
                    </motion.button>

                    <motion.button
                        onClick={handleBreakIt}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-all
              ${breakItOn
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-amber-400 hover:border-amber-500/40'
                            }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        💥 {breakItOn ? 'Fix it' : 'Break it'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

function SectionToggle({ label, count, open, onToggle }: { label: string; count?: number; open: boolean; onToggle: () => void }) {
    return (
        <button onClick={onToggle} className="w-full flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-[10px]">▶</motion.span>
            {label}
            {count !== undefined && count > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] bg-violet-500/10 text-violet-400 rounded-md">{count}</span>
            )}
        </button>
    );
}
