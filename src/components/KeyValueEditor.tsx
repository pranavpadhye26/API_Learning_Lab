'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Pair {
    id: string;
    key: string;
    value: string;
}

interface Props {
    pairs: Pair[];
    onChange: (pairs: Pair[]) => void;
    presets?: { label: string; key: string; value: string }[];
    placeholder?: { key: string; value: string };
    highlightKeys?: string[];
}

let nextId = 0;
function generateId(): string {
    // Use crypto.randomUUID if available, otherwise fallback to counter
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `kv-${Date.now()}-${nextId++}`;
}

/** Create a Pair with a stable ID */
export function createPair(key: string, value: string): Pair {
    return { id: generateId(), key, value };
}

export default function KeyValueEditor({ pairs, onChange, presets, placeholder, highlightKeys }: Props) {
    const [hovered, setHovered] = useState<number | null>(null);
    const [activeHighlights, setActiveHighlights] = useState<string[]>([]);
    const newRowRef = useRef<HTMLInputElement | null>(null);
    const shouldFocusNewRow = useRef(false);

    // When highlightKeys changes, activate them then fade after 2s
    useEffect(() => {
        if (highlightKeys && highlightKeys.length > 0) {
            setActiveHighlights(highlightKeys);
            const timer = setTimeout(() => setActiveHighlights([]), 2000);
            return () => clearTimeout(timer);
        } else {
            setActiveHighlights([]);
        }
    }, [highlightKeys]);

    // Focus newly added row
    useEffect(() => {
        if (shouldFocusNewRow.current && newRowRef.current) {
            newRowRef.current.focus();
            shouldFocusNewRow.current = false;
        }
    });

    const updatePair = useCallback((id: string, field: 'key' | 'value', val: string) => {
        const updated = pairs.map(p =>
            p.id === id ? { ...p, [field]: val } : p
        );
        onChange(updated);
    }, [pairs, onChange]);

    const removePair = useCallback((id: string) => {
        onChange(pairs.filter(p => p.id !== id));
    }, [pairs, onChange]);

    const addPair = useCallback(() => {
        shouldFocusNewRow.current = true;
        onChange([...pairs, createPair('', '')]);
    }, [pairs, onChange]);

    const addPreset = useCallback((preset: { key: string; value: string }) => {
        const existing = pairs.findIndex(p => p.key === preset.key);
        if (existing >= 0) {
            const updated = [...pairs];
            updated[existing] = { ...updated[existing], value: preset.value };
            onChange(updated);
        } else {
            onChange([...pairs, createPair(preset.key, preset.value)]);
        }
    }, [pairs, onChange]);

    return (
        <div className="space-y-1.5">
            {/* Presets */}
            {presets && presets.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {presets.map((preset) => (
                        <motion.button
                            key={preset.label}
                            onClick={() => addPreset(preset)}
                            className="px-2 py-0.5 text-[10px] font-medium bg-violet-500/10 text-violet-400 
                         rounded-md hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            + {preset.label}
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Pairs */}
            <AnimatePresence>
                {pairs.map((pair, idx) => {
                    const isHighlighted = pair.key && activeHighlights.includes(pair.key);
                    const isLastRow = idx === pairs.length - 1;
                    return (
                        <motion.div
                            key={pair.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`flex gap-1.5 items-center rounded-md transition-all ${isHighlighted ? 'highlight-pulse ring-1 ring-amber-400/60' : ''}`}
                            onMouseEnter={() => setHovered(idx)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <input
                                ref={isLastRow ? newRowRef : undefined}
                                type="text"
                                value={pair.key}
                                onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                                placeholder={placeholder?.key || 'Key'}
                                className="flex-1 px-2 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md 
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                            <input
                                type="text"
                                value={pair.value}
                                onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                                placeholder={placeholder?.value || 'Value'}
                                className="flex-1 px-2 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md 
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                            <motion.button
                                onClick={() => removePair(pair.id)}
                                className={`w-6 h-6 flex items-center justify-center text-xs rounded-md transition-all
                ${hovered === idx ? 'bg-red-500/10 text-red-400' : 'text-[var(--text-muted)] opacity-30'}`}
                                whileTap={{ scale: 0.9 }}
                            >
                                ✕
                            </motion.button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <motion.button
                onClick={addPair}
                className="w-full py-1.5 text-xs text-[var(--text-muted)] hover:text-violet-400 
                   border border-dashed border-[var(--border)] rounded-md hover:border-violet-500/30 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                + Add pair
            </motion.button>
        </div>
    );
}
