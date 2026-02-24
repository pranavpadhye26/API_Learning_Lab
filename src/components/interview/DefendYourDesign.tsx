'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DefendQuestion } from '@/lib/interview-types';

interface Props {
    questions: DefendQuestion[];
}

function DefendQuestionCard({ q, index }: { q: DefendQuestion; index: number }) {
    const [showReasoning, setShowReasoning] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
            className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg overflow-hidden"
        >
            {/* Question */}
            <div className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/15 flex items-center justify-center mt-0.5">
                        <span className="text-[10px] font-bold text-orange-400">{index + 1}</span>
                    </span>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                        {q.question}
                    </p>
                </div>
            </div>

            {/* Reveal button + reasoning */}
            <div className="px-4 pb-3">
                <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className={`text-[10px] font-semibold px-3 py-1.5 rounded-md transition-all ${showReasoning
                            ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                            : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                        }`}
                >
                    {showReasoning ? '▾ Hide model reasoning' : '▸ Reveal model reasoning'}
                </button>

                <AnimatePresence>
                    {showReasoning && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2.5 pl-3 border-l-2 border-orange-500/30">
                                <span className="text-[9px] font-bold text-orange-400/70 uppercase tracking-widest">Model reasoning</span>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                                    {q.modelReasoning}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function DefendYourDesign({ questions }: Props) {
    if (!questions || questions.length === 0) return null;

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Defend Your Design</h3>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Think through these follow-up questions, then reveal the model reasoning to compare.
                </p>
            </div>

            {/* Questions */}
            <div className="p-3 space-y-2">
                {questions.map((q, idx) => (
                    <DefendQuestionCard key={q.id} q={q} index={idx} />
                ))}
            </div>
        </div>
    );
}
