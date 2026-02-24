'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScoreReport, RubricCategory } from '@/lib/interview-types';

interface Props {
    report: ScoreReport;
    rubric?: RubricCategory[];
}

const GRADE_COLORS: Record<string, string> = {
    A: 'from-emerald-500 to-emerald-600',
    B: 'from-blue-500 to-blue-600',
    C: 'from-amber-500 to-amber-600',
    D: 'from-orange-500 to-orange-600',
    F: 'from-red-500 to-red-600',
};

export default function ScoreReportView({ report, rubric }: Props) {
    const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);
    return (
        <div className="space-y-4">
            {/* Overall Score Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Score Report</h3>
                        <p className="text-xs text-[var(--text-muted)]">{report.totalScore}/{report.maxScore} points</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[report.grade] || ''} flex items-center justify-center shadow-lg`}>
                            <span className="text-2xl font-black text-white">{report.grade}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[var(--text-primary)]">{report.percentage}%</span>
                        </div>
                    </div>
                </div>

                {/* Overall progress bar */}
                <div className="w-full h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${GRADE_COLORS[report.grade] || ''}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${report.percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>

                <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{report.summary}</p>
            </motion.div>

            {/* Category Breakdown */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">📊 Category Breakdown</h4>
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {report.categories.map((cat, idx) => {
                        const pct = cat.maxPoints > 0 ? Math.round((cat.earnedPoints / cat.maxPoints) * 100) : 0;
                        const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                            <motion.div
                                key={cat.category}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="px-4 py-3"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{cat.category}</span>
                                    <span className="text-xs font-mono text-[var(--text-muted)]">{cat.earnedPoints}/{cat.maxPoints}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        className={`h-full rounded-full ${color}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    />
                                </div>
                                {cat.feedback.length > 0 && (
                                    <ul className="space-y-0.5">
                                        {cat.feedback.map((fb, fi) => (
                                            <li key={fi} className="text-[11px] text-[var(--text-secondary)] flex gap-1.5">
                                                <span className="text-[var(--text-muted)]">•</span>
                                                {fb}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Per-category reasoning from rubric */}
                                {(() => {
                                    const rubricEntry = rubric?.find(r => r.category === cat.category);
                                    if (!rubricEntry?.reasoning) return null;
                                    const isExpanded = expandedReasoning === cat.category;
                                    return (
                                        <div className="mt-1.5">
                                            <button
                                                onClick={() => setExpandedReasoning(isExpanded ? null : cat.category)}
                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                                            >
                                                {isExpanded ? '▾ Hide reasoning' : '▸ Why this matters'}
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.p
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="text-[10px] text-[var(--text-secondary)] mt-1 pl-2 border-l-2 border-cyan-500/30 leading-relaxed"
                                                    >
                                                        {rubricEntry.reasoning}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Strengths + Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.strengths.length > 0 && (
                    <div className="bg-[var(--surface)] border border-emerald-500/20 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">✅ Strengths</h4>
                        <ul className="space-y-1">
                            {report.strengths.map((s, i) => (
                                <li key={i} className="text-xs text-[var(--text-secondary)]">• {s}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {report.improvements.length > 0 && (
                    <div className="bg-[var(--surface)] border border-amber-500/20 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">📈 Areas to Improve</h4>
                        <ul className="space-y-1">
                            {report.improvements.map((s, i) => (
                                <li key={i} className="text-xs text-[var(--text-secondary)]">• {s}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
