'use client';

import { motion } from 'framer-motion';
import type { LessonMeta } from '@/lib/types';

interface Props {
    lesson: LessonMeta;
}

export default function LessonOverview({ lesson }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4"
        >
            {/* Objective */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🎯</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Objective</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{lesson.objective}</p>
            </div>

            {/* What you'll learn */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">💡</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">What you&apos;ll learn</h3>
                </div>
                <ul className="space-y-2">
                    {lesson.willLearn.map((item, idx) => (
                        <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + idx * 0.08 }}
                            className="flex gap-2 text-sm text-[var(--text-secondary)]"
                        >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}
