'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { InterviewChallenge, InterviewAttempt } from '@/lib/interview-types';

interface Props {
    challenges: InterviewChallenge[];
    attempts: InterviewAttempt[];
    loading: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Hard: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function ChallengeList({ challenges, attempts, loading }: Props) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
                ))}
            </div>
        );
    }

    const getBestAttempt = (challengeId: string) => {
        const challengeAttempts = attempts.filter(a => a.challengeId === challengeId);
        if (challengeAttempts.length === 0) return null;
        return challengeAttempts.reduce((best, a) => a.report.percentage > best.report.percentage ? a : best);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge, idx) => {
                const best = getBestAttempt(challenge.id);
                const attemptCount = attempts.filter(a => a.challengeId === challenge.id).length;

                return (
                    <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                    >
                        <Link href={`/interview/${challenge.id}`}>
                            <div className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all cursor-pointer h-full">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-violet-400 transition-colors">
                                        {challenge.title}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${DIFFICULTY_COLORS[challenge.difficulty] || ''}`}>
                                        {challenge.difficulty}
                                    </span>
                                </div>

                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                                    {challenge.problemStatement}
                                </p>

                                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                    <span>⏱️ {challenge.timeLimitMinutes} min</span>
                                    <span>{challenge.modelSolution.endpoints.length} endpoints</span>
                                </div>

                                {best ? (
                                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                                        <span className="text-[11px] text-[var(--text-muted)]">{attemptCount} attempt{attemptCount !== 1 ? 's' : ''}</span>
                                        <span className={`text-xs font-bold ${best.report.percentage >= 70 ? 'text-emerald-400' : best.report.percentage >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                            Best: {best.report.percentage}%
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                        <span className="text-[11px] text-violet-400">Not attempted →</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}
