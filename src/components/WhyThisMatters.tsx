'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StepReasoning } from '@/lib/types';

interface Props {
    reasoning: StepReasoning;
    stepTitle: string;
    autoExpand?: boolean;
}

export default function WhyThisMatters({ reasoning, stepTitle, autoExpand = false }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-expand when a step is first completed
    useEffect(() => {
        if (autoExpand) {
            setIsOpen(true);
        }
    }, [autoExpand]);

    return (
        <div className="mt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
                <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                >
                    ▸
                </motion.span>
                Why this matters
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-2.5 pl-2 border-l-2 border-teal-500/20">
                            <div>
                                <h5 className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/70 mb-0.5">✅ Why this works</h5>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{reasoning.whyCorrect}</p>
                            </div>
                            {reasoning.whyNotAlternative && (
                                <div>
                                    <h5 className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">🤔 Why not the alternative?</h5>
                                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{reasoning.whyNotAlternative}</p>
                                </div>
                            )}
                            {reasoning.realWorldNote && (
                                <div>
                                    <h5 className="text-[9px] font-bold uppercase tracking-widest text-blue-400/70 mb-0.5">🌍 Real-world note</h5>
                                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{reasoning.realWorldNote}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
