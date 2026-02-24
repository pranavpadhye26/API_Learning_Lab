'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ChallengeList from '@/components/interview/ChallengeList';
import { useInterviewState } from '@/hooks/useInterviewState';

export default function InterviewPage() {
    const { challenges, loading, attempts } = useInterviewState();

    return (
        <div className="min-h-screen bg-[var(--bg)] flex flex-col">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🎯</span>
                            <h1 className="text-xl font-black text-[var(--text-primary)]">Interview Prep Mode</h1>
                        </div>
                        <Link href="/lesson/get-query-basics">
                            <motion.div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-violet-500/10 hover:text-violet-400 text-[var(--text-muted)] transition-all text-xs font-medium"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>📡</span> Learning Dashboard
                            </motion.div>
                        </Link>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] ml-9">
                        Practice API design questions with timed challenges, rubric-based scoring, and model solutions.
                    </p>
                </div>
            </header>

            {/* Stats bar */}
            <div className="border-b border-[var(--border)] bg-[var(--surface)]/50">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6 text-xs text-[var(--text-muted)]">
                    <span>📚 {challenges.length} challenges</span>
                    <span>🏆 {attempts.length} total attempts</span>
                    <span>✅ {new Set(attempts.filter(a => a.report.percentage >= 70).map(a => a.challengeId)).size} passed (≥70%)</span>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 max-w-5xl mx-auto px-6 py-6 w-full">
                <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">All Challenges</h2>
                </div>

                <ChallengeList challenges={challenges} attempts={attempts} loading={loading} />

                {/* Difficulty Legend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4"
                >
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Difficulty Guide</h4>
                    <div className="grid grid-cols-3 gap-3 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">Easy</span>
                            <span>15 min • Basic CRUD, simple resources</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">Medium</span>
                            <span>20–25 min • Relationships, auth, business logic</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-400 font-bold">Hard</span>
                            <span>30 min • Complex systems, multiple resources</span>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
