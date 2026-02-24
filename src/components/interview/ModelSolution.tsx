'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InterviewChallenge } from '@/lib/interview-types';

interface Props {
    challenge: InterviewChallenge;
    locked: boolean;
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-emerald-400',
    POST: 'text-amber-400',
    PUT: 'text-blue-400',
    PATCH: 'text-violet-400',
    DELETE: 'text-red-400',
};

export default function ModelSolution({ challenge, locked }: Props) {
    const [expanded, setExpanded] = useState(false);

    if (locked) {
        return (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-center">
                <span className="text-3xl mb-2 block">🔒</span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Model Solution</h4>
                <p className="text-xs text-[var(--text-muted)]">Submit your design to unlock the model solution</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[var(--surface-hover)]/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm">🏆</span>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Model Solution</h4>
                </div>
                <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="text-xs text-[var(--text-muted)]">▶</motion.span>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[var(--border)]"
                    >
                        <div className="px-5 py-4 space-y-4">
                            {/* Endpoints */}
                            <div>
                                <h5 className="text-[10px] font-bold uppercase text-violet-400 mb-2">Endpoints</h5>
                                <div className="space-y-2">
                                    {challenge.modelSolution.endpoints.map((ep, i) => (
                                        <div key={i} className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-mono text-xs font-bold ${METHOD_COLORS[ep.method] || ''}`}>{ep.method}</span>
                                                <span className="font-mono text-xs text-[var(--text-primary)]">{ep.path}</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--text-secondary)] mb-2">{ep.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {ep.statusCodes.map(code => (
                                                    <span key={code} className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${code < 300 ? 'bg-emerald-500/10 text-emerald-300' : code < 400 ? 'bg-blue-500/10 text-blue-300' : 'bg-amber-500/10 text-amber-300'}`}>{code}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Design Notes */}
                            <div>
                                <h5 className="text-[10px] font-bold uppercase text-emerald-400 mb-2">Design Notes</h5>
                                <ul className="space-y-1">
                                    {challenge.modelSolution.designNotes.map((note, i) => (
                                        <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                                            <span className="text-emerald-500/60">•</span>{note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
