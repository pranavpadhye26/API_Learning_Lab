'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onComplete: () => void;
}

const STEPS = [
    {
        title: 'Lesson Picker',
        description: 'Choose a lesson from the sidebar. Each one teaches a different API concept with hands-on practice.',
        icon: '📚',
        position: 'right' as const,
    },
    {
        title: 'Request Builder',
        description: 'This is where you build HTTP requests — change the method, path, headers, query parameters, and body.',
        icon: '🔧',
        position: 'center' as const,
    },
    {
        title: 'Send Button',
        description: 'Hit Send to fire your request at the simulator. Watch the loading indicator — there\'s real latency!',
        icon: '▶️',
        position: 'center' as const,
    },
    {
        title: 'Flow Trace',
        description: 'See your request travel through each server stage — client, auth, validation, service, database, response. Red means it stopped there.',
        icon: '🔄',
        position: 'left' as const,
    },
    {
        title: 'Explain Response',
        description: 'After getting a response, click "Explain" to open the teaching drawer. It tells you what happened, how to fix errors, and common mistakes.',
        icon: '📖',
        position: 'right' as const,
    },
];

export default function OnboardingTour({ onComplete }: Props) {
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(true);

    const handleNext = useCallback(() => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            handleDismiss(true);
        }
    }, [step]);

    const handleDismiss = useCallback((completed: boolean) => {
        setVisible(false);
        if (completed) {
            localStorage.setItem('api-lab-onboarding-done', 'true');
        }
        onComplete();
    }, [onComplete]);

    const handleSkip = useCallback(() => {
        handleDismiss(true);
    }, [handleDismiss]);

    useEffect(() => {
        const done = localStorage.getItem('api-lab-onboarding-done');
        if (done === 'true') {
            setVisible(false);
            onComplete();
        }
    }, [onComplete]);

    if (!visible) return null;

    const current = STEPS[step];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center"
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Card */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative z-10 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-[420px] max-w-[90vw] overflow-hidden"
                >
                    {/* Step indicator */}
                    <div className="flex gap-1.5 px-6 pt-5">
                        {STEPS.map((_, i) => (
                            <motion.div
                                key={i}
                                className={`h-1 rounded-full flex-1 transition-colors duration-300 ${i <= step ? 'bg-violet-500' : 'bg-[var(--surface-hover)]'
                                    }`}
                                animate={i === step ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{current.icon}</span>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                                    Step {step + 1} of {STEPS.length}
                                </p>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">{current.title}</h3>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{current.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-5 flex items-center justify-between gap-3">
                        <button
                            onClick={handleSkip}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Skip tour
                        </button>
                        <div className="flex gap-2">
                            {step > 0 && (
                                <motion.button
                                    onClick={() => setStep(s => s - 1)}
                                    className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Back
                                </motion.button>
                            )}
                            <motion.button
                                onClick={handleNext}
                                className="px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {step === STEPS.length - 1 ? "Let's go!" : 'Next'}
                            </motion.button>
                        </div>
                    </div>

                    {/* Don't show again */}
                    <div className="px-6 pb-4 border-t border-[var(--border)] pt-3">
                        <button
                            onClick={() => handleDismiss(true)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                            ✓ Don&apos;t show again
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
