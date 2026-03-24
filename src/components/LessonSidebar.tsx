'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { LessonMeta } from '@/lib/types';

interface Props {
    lessons: LessonMeta[];
    activeLessonId: string;
    completedLessons: string[];
    onMobileClose?: () => void;
}

const categoryIcons: Record<string, string> = {
    Fundamentals: '📡',
    'Creating Data': '✏️',
    Authentication: '🔐',
    'Data Patterns': '📊',
    Security: '🛡️',
};

export default function LessonSidebar({ lessons, activeLessonId, completedLessons, onMobileClose }: Props) {
    const grouped = lessons.reduce<Record<string, LessonMeta[]>>((acc, l) => {
        (acc[l.category] = acc[l.category] || []).push(l);
        return acc;
    }, {});

    return (
        <aside data-tour="sidebar" className="w-72 min-w-[280px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 pt-6 pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="API Learning Lab" width={32} height={32} className="w-8 h-8 rounded-lg" />
                    <div>
                        <h1 className="text-base font-bold text-[var(--text-primary)]">API Learning Lab</h1>
                        <p className="text-xs text-[var(--text-muted)]">Interactive API Tutorials</p>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="px-5 py-3 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Progress</span>
                    <span className="text-xs font-semibold text-violet-400">{completedLessons.length}/{lessons.length}</span>
                </div>
                <div className="h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: lessons.length > 0 ? `${(completedLessons.length / lessons.length) * 100}%` : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Interview Mode */}
            <div className="px-3 pt-3">
                <Link href="/interview">
                    <motion.div
                        className="w-full px-3 py-3 rounded-xl bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 hover:border-violet-500/40 hover:from-violet-600/20 hover:to-purple-600/20 transition-all flex items-center gap-2.5 group"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-base">🎯</span>
                        <div>
                            <span className="text-sm font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">Interview Mode</span>
                            <p className="text-[10px] text-[var(--text-muted)]">Practice API design challenges</p>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* AI Sandbox */}
            <div className="px-3 pt-1.5">
                <Link href="/sandbox">
                    <motion.div
                        className="w-full px-3 py-3 rounded-xl bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 hover:border-cyan-500/40 hover:from-cyan-600/20 hover:to-blue-600/20 transition-all flex items-center gap-2.5 group"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-base">⚡</span>
                        <div>
                            <span className="text-sm font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">AI Sandbox</span>
                            <p className="text-[10px] text-[var(--text-muted)]">Free-form AI-powered playground</p>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Lessons */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {Object.entries(grouped).map(([category, categoryLessons]) => (
                    <div key={category}>
                        <div className="flex items-center gap-1.5 px-2 mb-1.5">
                            <span className="text-xs">{categoryIcons[category] || '📁'}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{category}</span>
                        </div>
                        <div className="space-y-0.5">
                            {categoryLessons.map((lesson) => {
                                const isActive = lesson.lessonId === activeLessonId;
                                const isComplete = completedLessons.includes(lesson.lessonId);
                                return (
                                    <Link
                                        key={lesson.lessonId}
                                        href={`/lesson/${lesson.lessonId}`}
                                        onClick={onMobileClose}
                                    >
                                        <motion.div
                                            className={`
                      w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                      flex items-center gap-2.5
                      ${isActive
                                                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-transparent'
                                                }
                    `}
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
                      ${isComplete
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : isActive
                                                        ? 'bg-violet-500/20 text-violet-400'
                                                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                                                }
                    `}>
                                                {isComplete ? '✓' : ''}
                                            </span>
                                            <span className="truncate font-medium">{lesson.title}</span>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-muted)] text-center">Built for learning APIs interactively</p>
            </div>
        </aside>
    );
}
