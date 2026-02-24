'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import type { TraceStep } from '@/lib/types';

interface Props {
    trace: TraceStep[] | null;
    loading: boolean;
}

const STAGES = ['client', 'server', 'auth', 'validation', 'service', 'db', 'response'] as const;

const stageLabels: Record<string, string> = {
    client: 'Client',
    server: 'Server',
    auth: 'Auth',
    validation: 'Validate',
    service: 'Service',
    db: 'Database',
    response: 'Response',
};

const stageIcons: Record<string, string> = {
    client: '🌐',
    server: '🖥️',
    auth: '🔑',
    validation: '✅',
    service: '⚙️',
    db: '🗄️',
    response: '📨',
};

export default function FlowPanel({ trace, loading }: Props) {
    const [visibleStages, setVisibleStages] = useState<number>(0);
    const animatingRef = useRef(false);

    useEffect(() => {
        setVisibleStages(0);
        if (!trace || trace.length === 0) return;

        animatingRef.current = true;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisibleStages(i);
            if (i >= trace.length) {
                clearInterval(interval);
                animatingRef.current = false;
            }
        }, 350);

        return () => {
            clearInterval(interval);
            animatingRef.current = false;
        };
    }, [trace]);

    // Map trace steps by stage
    const traceByStage = new Map<string, TraceStep>();
    if (trace) {
        for (const step of trace) {
            traceByStage.set(step.stage, step);
        }
    }

    // Determine which stages are in the trace
    const traceStages = trace ? trace.map(t => t.stage) : [];
    const lastTraceStage = traceStages.length > 0 ? traceStages[traceStages.length - 1] : null;
    const lastOk = trace && trace.length > 0 ? trace[trace.length - 1].ok : null;

    return (
        <div data-tour="flow-panel" className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Request Flow</span>
                {loading && (
                    <motion.div
                        className="w-2 h-2 rounded-full bg-yellow-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center gap-1">
                {STAGES.map((stage, idx) => {
                    const step = traceByStage.get(stage);
                    const stageIdx = traceStages.indexOf(stage);
                    const isVisible = stageIdx >= 0 && stageIdx < visibleStages;
                    const isLastFailed = stage === lastTraceStage && lastOk === false;
                    const isSuccess = step?.ok === true && isVisible;
                    const isFailed = step?.ok === false && isVisible;
                    const isAbove = !trace || stageIdx < 0;

                    return (
                        <div key={stage}>
                            <motion.div
                                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
                  ${isFailed ? 'bg-red-500/10 border border-red-500/30' : ''}
                  ${isSuccess ? 'bg-emerald-500/5 border border-emerald-500/20' : ''}
                  ${!isVisible && !isAbove ? 'opacity-30' : ''}
                  ${isAbove && !trace ? 'opacity-40' : ''}
                  ${isAbove && trace ? 'opacity-20' : ''}
                `}
                                initial={false}
                                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Stage icon */}
                                <motion.div
                                    className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0
                    ${isFailed ? 'bg-red-500/20' : isSuccess ? 'bg-emerald-500/15' : 'bg-[var(--surface-hover)]'}
                  `}
                                    animate={isVisible ? { scale: [0.8, 1.1, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                >
                                    {stageIcons[stage]}
                                </motion.div>

                                {/* Stage info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${isFailed ? 'text-red-400' : isSuccess ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                                            {stageLabels[stage]}
                                        </span>
                                        {isVisible && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`text-[10px] ${isFailed ? 'text-red-400' : 'text-emerald-400'}`}
                                            >
                                                {isFailed ? '✗' : '✓'}
                                            </motion.span>
                                        )}
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {isVisible && step && (
                                            <motion.p
                                                key={step.msg}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className={`text-[11px] truncate ${isFailed ? 'text-red-300/80' : 'text-[var(--text-muted)]'}`}
                                            >
                                                {step.msg}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Status dot */}
                                {isVisible && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${isFailed ? 'bg-red-400' : 'bg-emerald-400'}`}
                                    />
                                )}
                            </motion.div>

                            {/* Connector line */}
                            {idx < STAGES.length - 1 && (
                                <div className="flex justify-start pl-[22px] py-0">
                                    <div className={`w-0.5 h-2 rounded-full ${isVisible && isSuccess ? 'bg-emerald-500/30' :
                                        isLastFailed ? 'bg-red-500/20' :
                                            'bg-[var(--border)]'
                                        }`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {!trace && !loading && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-[var(--text-muted)] text-center">
                        Send a request to see the<br />flow animation here
                    </p>
                </div>
            )}
        </div>
    );
}
