'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SandboxHistoryEntry } from '@/lib/sandbox-types';

interface Props {
    history: SandboxHistoryEntry[];
    onSelect: (entry: SandboxHistoryEntry) => void;
    onClear: () => void;
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-500/10',
    POST: 'text-blue-400 bg-blue-500/10',
    PUT: 'text-amber-400 bg-amber-500/10',
    PATCH: 'text-orange-400 bg-orange-500/10',
    DELETE: 'text-red-400 bg-red-500/10',
};

function statusColor(code: number): string {
    if (code >= 200 && code < 300) return 'text-emerald-400';
    if (code >= 300 && code < 400) return 'text-blue-400';
    if (code >= 400 && code < 500) return 'text-amber-400';
    return 'text-red-400';
}

function relativeTime(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function SandboxHistory({ history, onSelect, onClear }: Props) {
    const [expanded, setExpanded] = useState(true);

    if (history.length === 0) return null;

    return (
        <div className="border-t border-[var(--border)] px-3 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-2"
                >
                    <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="text-[10px] text-[var(--text-muted)]">▶</motion.span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        History ({history.length})
                    </span>
                </button>
                <button
                    onClick={onClear}
                    className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    title="Clear history"
                >
                    Clear
                </button>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-0.5 overflow-hidden max-h-60 overflow-y-auto"
                    >
                        {history.map((entry, i) => (
                            <motion.button
                                key={entry.id}
                                onClick={() => onSelect(entry)}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 group"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                whileHover={{ x: 2 }}
                            >
                                {/* Method badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${METHOD_COLORS[entry.method] || 'text-gray-400 bg-gray-500/10'}`}>
                                    {entry.method.slice(0, 3)}
                                </span>

                                {/* Path */}
                                <span className="text-[11px] text-[var(--text-secondary)] font-mono truncate flex-1 min-w-0 group-hover:text-[var(--text-primary)] transition-colors">
                                    {entry.path}
                                </span>

                                {/* Status + time */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`text-[10px] font-bold ${statusColor(entry.status)}`}>
                                        {entry.status || '—'}
                                    </span>
                                    <span className="text-[9px] text-[var(--text-muted)]">
                                        {relativeTime(entry.timestamp)}
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
