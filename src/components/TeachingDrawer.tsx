'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TeachingPayload } from '@/lib/types';

interface Props {
    open: boolean;
    teaching: TeachingPayload | null;
    status?: number;
    onClose: () => void;
}

export default function TeachingDrawer({ open, teaching, status, onClose }: Props) {
    const isSuccess = status !== undefined && status >= 200 && status < 300;

    return (
        <AnimatePresence>
            {open && teaching && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] bg-[var(--surface)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`text-lg ${isSuccess ? '' : ''}`}>{isSuccess ? '✨' : '📖'}</span>
                                <h3 className="text-sm font-bold text-[var(--text-primary)]">{teaching.title}</h3>
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="w-7 h-7 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                ✕
                            </motion.button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {/* Explanation */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Explanation</h4>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{teaching.explanation}</p>
                            </motion.div>

                            {/* Fix Steps */}
                            {teaching.fixSteps.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                                        {isSuccess ? '💡 Tips' : '🔧 How to Fix'}
                                    </h4>
                                    <ul className="space-y-2">
                                        {teaching.fixSteps.map((step, idx) => (
                                            <motion.li
                                                key={idx}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + idx * 0.1 }}
                                                className="flex gap-2 text-sm"
                                            >
                                                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${isSuccess ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/15 text-violet-400'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="text-[var(--text-secondary)] leading-relaxed">{step}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}

                            {/* Common Mistakes */}
                            {teaching.commonMistakes.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">⚠ Common Mistakes</h4>
                                    <ul className="space-y-1.5">
                                        {teaching.commonMistakes.map((mistake, idx) => (
                                            <li key={idx} className="text-sm text-amber-300/80 flex gap-2">
                                                <span className="text-amber-500/60 flex-shrink-0">•</span>
                                                {mistake}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border)]">
                            <motion.button
                                onClick={onClose}
                                className="w-full py-2 rounded-lg text-xs font-bold bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                Got it!
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
