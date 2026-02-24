'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
    target: string; // data-tour attribute value
    title: string;
    description: string;
    icon: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: 'sidebar',
        title: 'Lesson Picker',
        description: 'Browse lessons by category. Each one teaches a different API concept — from GET basics to bearer auth. Your progress is tracked automatically.',
        icon: '📚',
    },
    {
        target: 'request-builder',
        title: 'Request Builder',
        description: 'This is your sandbox. Change the HTTP method, path, headers, query parameters, and request body. Everything is editable.',
        icon: '🔧',
    },
    {
        target: 'send-button',
        title: 'Send Button',
        description: 'Hit Send to fire your request at the simulator. You\'ll see real latency and a full response — just like calling a real API.',
        icon: '▶️',
    },
    {
        target: 'flow-panel',
        title: 'Flow Trace',
        description: 'Watch your request travel through each server stage — client, auth, validation, service, database, response. Red means it stopped there.',
        icon: '🔄',
    },
    {
        target: 'response-viewer',
        title: 'Response Viewer',
        description: 'See the full response: status code, headers, and body. Hit "Explain" to open the teaching drawer that breaks down what happened.',
        icon: '📨',
    },
];

interface Props {
    onComplete: () => void;
}

export default function GuidedTour({ onComplete }: Props) {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' | 'left' | 'right' }>({
        top: 0,
        left: 0,
        placement: 'bottom',
    });
    const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const current = TOUR_STEPS[step];

    // Find and measure the target element
    const measureTarget = useCallback(() => {
        const el = document.querySelector(`[data-tour="${TOUR_STEPS[step]?.target}"]`);
        if (!el) {
            setRect(null);
            return;
        }
        const r = el.getBoundingClientRect();
        setRect(r);

        // Calculate tooltip position
        const pad = 16;
        const tooltipW = 360;
        const tooltipH = 200;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
        let top = r.bottom + pad;
        let left = r.left + r.width / 2 - tooltipW / 2;

        // If not enough space below, try above
        if (top + tooltipH > vh - 20) {
            placement = 'top';
            top = r.top - tooltipH - pad;
        }

        // If not enough space above either, try right
        if (top < 20) {
            placement = 'right';
            top = r.top + r.height / 2 - tooltipH / 2;
            left = r.right + pad;
        }

        // If not enough space on right, try left
        if (left + tooltipW > vw - 20) {
            if (placement === 'right') {
                placement = 'left';
                left = r.left - tooltipW - pad;
            } else {
                left = vw - tooltipW - 20;
            }
        }

        // Clamp
        left = Math.max(12, Math.min(left, vw - tooltipW - 12));
        top = Math.max(12, Math.min(top, vh - tooltipH - 12));

        setTooltipPos({ top, left, placement });
    }, [step]);

    useEffect(() => {
        // Small delay to let layout settle
        const timer = setTimeout(measureTarget, 150);

        const handleResize = () => {
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = setTimeout(measureTarget, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', measureTarget, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', measureTarget, true);
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
        };
    }, [measureTarget]);

    const handleNext = useCallback(() => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            handleDismiss(true);
        }
    }, [step]);

    const handleDismiss = useCallback((completed: boolean) => {
        if (completed) {
            localStorage.setItem('api-lab-guided-tour-done', 'true');
        }
        onComplete();
    }, [onComplete]);

    const handleSkip = useCallback(() => {
        handleDismiss(true);
    }, [handleDismiss]);

    // Overlay cutout with the highlighted area
    const padding = 8;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200]"
                style={{ pointerEvents: 'auto' }}
            >
                {/* SVG overlay with cutout */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: 'none' }}
                >
                    <defs>
                        <mask id="tour-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {rect && (
                                <rect
                                    x={rect.left - padding}
                                    y={rect.top - padding}
                                    width={rect.width + padding * 2}
                                    height={rect.height + padding * 2}
                                    rx="12"
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(0,0,0,0.65)"
                        mask="url(#tour-mask)"
                        style={{ pointerEvents: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </svg>

                {/* Highlight border ring */}
                {rect && (
                    <motion.div
                        className="absolute border-2 border-violet-500 rounded-xl pointer-events-none shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            top: rect.top - padding,
                            left: rect.left - padding,
                            width: rect.width + padding * 2,
                            height: rect.height + padding * 2,
                        }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        {/* Pulse ring */}
                        <motion.div
                            className="absolute inset-0 border-2 border-violet-400/40 rounded-xl"
                            animate={{ scale: [1, 1.03, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    </motion.div>
                )}

                {/* Tooltip */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: tooltipPos.placement === 'top' ? 10 : -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    className="absolute z-10 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/40 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden"
                    style={{ top: tooltipPos.top, left: tooltipPos.left }}
                >
                    {/* Step indicator */}
                    <div className="flex gap-1.5 px-5 pt-4">
                        {TOUR_STEPS.map((_, i) => (
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
                    <div className="px-5 py-4">
                        <div className="flex items-center gap-3 mb-2.5">
                            <span className="text-2xl">{current.icon}</span>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                                    Step {step + 1} of {TOUR_STEPS.length}
                                </p>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">{current.title}</h3>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{current.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-4 flex items-center justify-between gap-3">
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
                                {step === TOUR_STEPS.length - 1 ? "Let's go!" : 'Next'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
