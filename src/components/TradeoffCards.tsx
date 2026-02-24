'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradeoffCard } from '@/lib/types';

interface Props {
    cards: TradeoffCard[];
}

function TradeoffCardItem({ card, index }: { card: TradeoffCard; index: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
        >
            {/* Card Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm">⚖️</span>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{card.title}</h4>
                </div>
                <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    className="text-[var(--text-muted)] text-xs"
                >
                    ▾
                </motion.span>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {/* Option A vs B comparison */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Option A */}
                                <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
                                    <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                                        {card.optionA.label}
                                    </h5>
                                    <div className="space-y-1.5">
                                        {card.optionA.pros.map((pro, i) => (
                                            <p key={`a-pro-${i}`} className="text-[10px] text-emerald-400 flex gap-1">
                                                <span>+</span> {pro}
                                            </p>
                                        ))}
                                        {card.optionA.cons.map((con, i) => (
                                            <p key={`a-con-${i}`} className="text-[10px] text-red-400 flex gap-1">
                                                <span>−</span> {con}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {/* Option B */}
                                <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-3">
                                    <h5 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">
                                        {card.optionB.label}
                                    </h5>
                                    <div className="space-y-1.5">
                                        {card.optionB.pros.map((pro, i) => (
                                            <p key={`b-pro-${i}`} className="text-[10px] text-emerald-400 flex gap-1">
                                                <span>+</span> {pro}
                                            </p>
                                        ))}
                                        {card.optionB.cons.map((con, i) => (
                                            <p key={`b-con-${i}`} className="text-[10px] text-red-400 flex gap-1">
                                                <span>−</span> {con}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* When to choose */}
                            <div className="bg-[var(--surface-hover)] rounded-lg p-3">
                                <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                                    🎯 When to choose
                                </h5>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-[var(--text-secondary)]">
                                        <span className="text-blue-400 font-semibold">{card.optionA.label}:</span> {card.whenToChoose.a}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-secondary)]">
                                        <span className="text-violet-400 font-semibold">{card.optionB.label}:</span> {card.whenToChoose.b}
                                    </p>
                                </div>
                            </div>

                            {/* Failure scenario */}
                            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                                <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                                    ⚠️ What goes wrong
                                </h5>
                                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                                    {card.failureScenario}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function TradeoffCards({ cards }: Props) {
    if (!cards || cards.length === 0) return null;

    return (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                <span className="text-sm">⚖️</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Design Tradeoffs</h3>
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md ml-auto">
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </span>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-2">
                {cards.map((card, idx) => (
                    <TradeoffCardItem key={card.id} card={card} index={idx} />
                ))}
            </div>
        </div>
    );
}
