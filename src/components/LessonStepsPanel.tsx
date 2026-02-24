'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LessonStep, SimulateResponse, SandboxPrompt } from '@/lib/types';
import WhyThisMatters from './WhyThisMatters';

interface Props {
    lessonId: string;
    steps: LessonStep[];
    response: SimulateResponse | null;
    sandboxPrompts?: SandboxPrompt[];
    currentRequest?: { method: string; query: Record<string, string> };
}

export default function LessonStepsPanel({ lessonId, steps, response, sandboxPrompts, currentRequest }: Props) {
    const [completedSteps, setCompletedSteps] = useState<Record<string, string[]>>({});
    const [expandedHint, setExpandedHint] = useState<string | null>(null);
    const [expandedSandbox, setExpandedSandbox] = useState<string | null>(null);
    const [newlyCompleted, setNewlyCompleted] = useState<string | null>(null);

    // Load completed steps from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('api-lab-step-progress');
            if (saved) setCompletedSteps(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Save completed steps to localStorage
    const saveProgress = useCallback((updated: Record<string, string[]>) => {
        setCompletedSteps(updated);
        try {
            localStorage.setItem('api-lab-step-progress', JSON.stringify(updated));
        } catch { /* ignore */ }
    }, []);

    // Smarter step validation — checks status, method, and query params
    useEffect(() => {
        if (!response || !steps.length) return;

        const status = response.http.status;
        const current = completedSteps[lessonId] || [];

        // Find first incomplete step that matches
        const matched: string[] = [];
        for (const step of steps) {
            if (current.includes(step.id) || matched.includes(step.id)) continue;

            const statusMatch = step.expected.status === status;
            const methodMatch = !step.expected.method || (currentRequest?.method === step.expected.method);
            const queryMatch = !step.expectedQuery || Object.entries(step.expectedQuery).every(
                ([k, v]) => currentRequest?.query?.[k] === v
            );

            if (statusMatch && methodMatch && queryMatch) {
                matched.push(step.id);
                setNewlyCompleted(step.id);
                // Clear the "newly completed" highlight after animation
                setTimeout(() => setNewlyCompleted(null), 3000);
                break; // Only complete one step per response
            }
        }

        if (matched.length > 0) {
            const updated = {
                ...completedSteps,
                [lessonId]: [...current, ...matched],
            };
            saveProgress(updated);
        }
    }, [response, steps, lessonId]); // intentionally not including completedSteps/saveProgress/currentRequest to avoid infinite loops

    const currentCompleted = useMemo(() => completedSteps[lessonId] || [], [completedSteps, lessonId]);

    // Find current step (first incomplete)
    const currentStepIdx = useMemo(() => {
        const idx = steps.findIndex(s => !currentCompleted.includes(s.id));
        return idx === -1 ? steps.length : idx;
    }, [steps, currentCompleted]);

    const allComplete = currentStepIdx >= steps.length;

    return (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">📋</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Guided Steps</h3>
                </div>
                <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                    {currentCompleted.length}/{steps.length}
                </span>
            </div>

            {/* Steps */}
            <div className="px-3 py-2">
                {steps.map((step, idx) => {
                    const isComplete = currentCompleted.includes(step.id);
                    const isCurrent = idx === currentStepIdx;
                    const isFuture = idx > currentStepIdx;
                    const isNewlyDone = newlyCompleted === step.id;

                    return (
                        <div key={step.id} className="relative">
                            {/* Connector line */}
                            {idx < steps.length - 1 && (
                                <div className={`absolute left-[14px] top-[32px] w-px h-[calc(100%-20px)] ${isComplete ? 'bg-emerald-500/30' : 'bg-[var(--border)]'}`} />
                            )}

                            <motion.div
                                initial={false}
                                animate={isCurrent ? { backgroundColor: 'rgba(139, 92, 246, 0.05)' } : { backgroundColor: 'transparent' }}
                                className={`flex gap-3 px-2 py-2.5 rounded-lg relative ${isCurrent ? 'border border-violet-500/20' : 'border border-transparent'}`}
                            >
                                {/* Status icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {isComplete ? (
                                        <motion.div
                                            initial={{ scale: 0.5 }}
                                            animate={{ scale: 1 }}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center ${isNewlyDone ? 'bg-emerald-500/30' : 'bg-emerald-500/20'}`}
                                        >
                                            <span className="text-emerald-400 text-xs">✓</span>
                                        </motion.div>
                                    ) : isCurrent ? (
                                        <motion.div
                                            animate={{ boxShadow: ['0 0 0 0 rgba(139,92,246,0.3)', '0 0 0 6px rgba(139,92,246,0)', '0 0 0 0 rgba(139,92,246,0.3)'] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center"
                                        >
                                            <span className="text-violet-400 text-[10px] font-bold">{idx + 1}</span>
                                        </motion.div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
                                            <span className="text-[var(--text-muted)] text-[10px] font-bold">{idx + 1}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-semibold mb-0.5 ${isComplete ? 'text-emerald-400' : isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                                        {step.title}
                                    </h4>

                                    {/* Concept Note — shown before instruction for current step */}
                                    {step.conceptNote && isCurrent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mb-2 px-2.5 py-2 rounded-lg bg-violet-500/8 border border-violet-500/15"
                                        >
                                            <p className="text-[11px] text-violet-300/90 leading-relaxed flex gap-2">
                                                <span className="flex-shrink-0 mt-0.5">💡</span>
                                                <span>{step.conceptNote}</span>
                                            </p>
                                        </motion.div>
                                    )}

                                    <p className={`text-[11px] leading-relaxed ${isFuture ? 'text-[var(--text-muted)]/60' : 'text-[var(--text-secondary)]'}`}>
                                        {step.instruction}
                                    </p>

                                    {/* Hint toggle */}
                                    {step.hint && isCurrent && (
                                        <div className="mt-1.5">
                                            <button
                                                onClick={() => setExpandedHint(expandedHint === step.id ? null : step.id)}
                                                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                                            >
                                                {expandedHint === step.id ? '▾ Hide hint' : '▸ Show hint'}
                                            </button>
                                            <AnimatePresence>
                                                {expandedHint === step.id && (
                                                    <motion.p
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="text-[11px] text-amber-300/80 mt-1 pl-2 border-l-2 border-amber-500/30"
                                                    >
                                                        💡 {step.hint}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Why This Matters — shown after step completion, auto-expanded for newly completed */}
                                    {isComplete && step.reasoning && (
                                        <WhyThisMatters
                                            reasoning={step.reasoning}
                                            stepTitle={step.title}
                                            autoExpand={isNewlyDone}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Completion: Sandbox Mode */}
            <AnimatePresence>
                {allComplete && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-[var(--border)]"
                    >
                        {/* Completion banner */}
                        <div className="px-4 py-3 bg-emerald-500/5">
                            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                                <span>🎉</span> All steps complete! Check the recap below for key takeaways.
                            </p>
                        </div>

                        {/* Sandbox Prompts */}
                        {sandboxPrompts && sandboxPrompts.length > 0 && (
                            <div className="px-4 py-3 bg-[var(--bg)]/50">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <span className="text-sm">🧪</span>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Sandbox — Keep Exploring</h4>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">
                                    Steps are done, but there&apos;s more to discover. Try these open-ended experiments — there&apos;s no right or wrong answer.
                                </p>
                                <div className="space-y-2">
                                    {sandboxPrompts.map((sp) => (
                                        <div key={sp.prompt} className="group">
                                            <button
                                                onClick={() => setExpandedSandbox(expandedSandbox === sp.prompt ? null : sp.prompt)}
                                                className="w-full text-left flex gap-2 items-start px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-violet-500/20 transition-colors"
                                            >
                                                <span className="text-violet-400 text-[10px] mt-0.5 flex-shrink-0">▸</span>
                                                <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{sp.prompt}</span>
                                            </button>
                                            <AnimatePresence>
                                                {expandedSandbox === sp.prompt && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="text-[11px] text-amber-300/70 mt-1 ml-5 pl-2 border-l-2 border-amber-500/20 py-1">
                                                            💡 {sp.hint}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
