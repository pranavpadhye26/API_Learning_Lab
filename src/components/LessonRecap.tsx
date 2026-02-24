'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LessonMeta } from '@/lib/types';

interface Props {
    lesson: LessonMeta;
}

export default function LessonRecap({ lesson }: Props) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            {/* Toggle header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[var(--surface-hover)]/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm">🧠</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Lesson Recap & Interview Prep</h3>
                </div>
                <motion.span
                    animate={{ rotate: expanded ? 90 : 0 }}
                    className="text-xs text-[var(--text-muted)]"
                >
                    ▶
                </motion.span>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-5 border-t border-[var(--border)] pt-4">
                            {/* Key Takeaways */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                                    <span>📌</span> Key Takeaways
                                </h4>
                                <ul className="space-y-2">
                                    {lesson.takeaways.map((item, idx) => (
                                        <li key={idx} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                                            <span className="text-emerald-500/60 flex-shrink-0 mt-1">•</span>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Interview Notes */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
                                    <span>💼</span> Interview Notes
                                </h4>
                                <ul className="space-y-2">
                                    {lesson.interviewNotes.map((item, idx) => (
                                        <li key={idx} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                                            <span className="text-amber-500/60 flex-shrink-0 mt-1">•</span>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Example Explanation */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2 flex items-center gap-1.5">
                                    <span>🗣️</span> How to explain this in an interview
                                </h4>
                                <div className="bg-[var(--bg)] rounded-lg p-3.5 border border-[var(--border)]">
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                                        &ldquo;{lesson.interviewExplanation}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
