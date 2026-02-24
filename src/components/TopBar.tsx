'use client';

import { motion } from 'framer-motion';

interface Props {
    title: string;
    description: string;
    progress: number;
    completedCount: number;
    totalCount: number;
    onReset: () => void;
    onHelp?: () => void;
}

export default function TopBar({ title, description, progress, completedCount, totalCount, onReset, onHelp }: Props) {
    return (
        <header className="h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-5 flex-shrink-0">
            <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">{title}</h2>
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-md">{description}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {Array.from({ length: totalCount }, (_, i) => (
                            <motion.div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < completedCount ? 'bg-emerald-400' : 'bg-[var(--surface-hover)]'}`}
                                initial={false}
                                animate={i < completedCount ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                        {Math.round(progress * 100)}%
                    </span>
                </div>

                {/* Help button */}
                {onHelp && (
                    <motion.button
                        onClick={onHelp}
                        className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-hover)] rounded-lg hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Replay onboarding tour"
                    >
                        ? Help
                    </motion.button>
                )}

                {/* Reset button */}
                <motion.button
                    onClick={onReset}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-hover)] rounded-lg hover:text-[var(--text-primary)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    ↺ Reset
                </motion.button>
            </div>
        </header>
    );
}
