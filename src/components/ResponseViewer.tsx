'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SimulateResponse } from '@/lib/types';

interface Props {
    response: SimulateResponse | null;
    onExplain: () => void;
}

const STATUS_LABELS: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
};

function statusColor(code: number): string {
    if (code >= 200 && code < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (code >= 300 && code < 400) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (code >= 400 && code < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
}

export default function ResponseViewer({ response, onExplain }: Props) {
    const [tab, setTab] = useState<'body' | 'headers'>('body');

    if (!response) {
        return (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="text-3xl mb-3 opacity-30">📭</div>
                    <p className="text-xs text-[var(--text-muted)]">
                        No response yet.<br />Send a request to see results here.
                    </p>
                </div>
            </div>
        );
    }

    const { http, teaching } = response;
    const label = STATUS_LABELS[http.status] || 'Unknown';
    const isSuccess = http.status >= 200 && http.status < 300;

    return (
        <div data-tour="response-viewer" className="bg-[var(--surface)] rounded-xl border border-[var(--border)] flex flex-col h-full overflow-hidden">
            {/* Status Code */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Response</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{http.latencyMs}ms</span>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${statusColor(http.status)}`}
                >
                    <span className="text-2xl font-black">{http.status}</span>
                    <span className="text-sm font-semibold">{label}</span>
                </motion.div>

                {/* Inline insight — one-line learning note */}
                {teaching && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className={`mt-2 flex items-start gap-2 px-3 py-1.5 rounded-md text-[11px] leading-relaxed ${isSuccess
                                ? 'bg-emerald-500/5 text-emerald-300/80 border border-emerald-500/10'
                                : 'bg-amber-500/5 text-amber-300/80 border border-amber-500/10'
                            }`}
                    >
                        <span className="flex-shrink-0 mt-0.5">{isSuccess ? '🎓' : '⚠️'}</span>
                        <span>{teaching.title}</span>
                    </motion.div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
                {(['body', 'headers'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors relative
              ${tab === t ? 'text-violet-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}
            `}
                    >
                        {t}
                        {tab === t && (
                            <motion.div
                                layoutId="resp-tab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                                transition={{ duration: 0.2 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
                {tab === 'body' && (
                    <motion.pre
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words"
                    >
                        {typeof http.body === 'string' ? http.body : JSON.stringify(http.body, null, 2)}
                    </motion.pre>
                )}
                {tab === 'headers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                        {Object.entries(http.headers).map(([key, value]) => (
                            <div key={key} className="flex gap-2 text-[11px]">
                                <span className="text-violet-400 font-semibold font-mono">{key}:</span>
                                <span className="text-[var(--text-secondary)] font-mono break-all">{value}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Explain Button */}
            <div className="p-3 border-t border-[var(--border)]">
                <motion.button
                    onClick={onExplain}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all border
            ${isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {isSuccess ? '✨ Understanding this response' : '🔍 Explain this response'}
                </motion.button>
            </div>
        </div>
    );
}
