'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
    timeLimitMinutes: number;
    startedAt: number;
    submitted: boolean;
}

export default function Timer({ timeLimitMinutes, startedAt, submitted }: Props) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalSeconds = timeLimitMinutes * 60;

    useEffect(() => {
        if (submitted) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startedAt, submitted]);

    const remaining = Math.max(totalSeconds - elapsed, 0);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const pct = Math.min(elapsed / totalSeconds, 1);
    const isWarning = pct > 0.75;
    const isExpired = remaining === 0;

    const color = isExpired ? 'text-red-500' : isWarning ? 'text-amber-400' : 'text-emerald-400';
    const bgColor = isExpired ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400';

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="text-xs">⏱️</span>
                <motion.span
                    className={`text-sm font-mono font-bold ${color}`}
                    animate={isWarning && !submitted ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </motion.span>
            </div>
            {/* Progress bar */}
            <div className="w-20 h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${bgColor}`}
                    initial={false}
                    animate={{ width: `${(1 - pct) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
    );
}
