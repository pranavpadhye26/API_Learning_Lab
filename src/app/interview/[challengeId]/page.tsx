'use client';

import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useInterviewState } from '@/hooks/useInterviewState';
import EndpointEditor from '@/components/interview/EndpointEditor';
import Timer from '@/components/interview/Timer';
import ScoreReportView from '@/components/interview/ScoreReportView';
import ModelSolution from '@/components/interview/ModelSolution';
import DefendYourDesign from '@/components/interview/DefendYourDesign';

export default function InterviewWorkspace({ params }: { params: Promise<{ challengeId: string }> }) {
    const { challengeId } = use(params);
    const {
        activeChallenge, design, report, submitted, loading, scoring,
        addEndpoint, removeEndpoint, updateEndpoint, submitDesign, resetDesign,
    } = useInterviewState(challengeId);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
                <div className="animate-pulse text-sm text-[var(--text-muted)]">Loading challenge...</div>
            </div>
        );
    }

    if (!activeChallenge) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center flex-col gap-3">
                <p className="text-sm text-[var(--text-muted)]">Challenge not found</p>
                <Link href="/interview" className="text-xs text-violet-400 hover:underline">← Back to challenges</Link>
            </div>
        );
    }

    const DIFF_COLORS: Record<string, string> = {
        Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        Hard: 'bg-red-500/10 text-red-400 border-red-500/30',
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] flex flex-col">
            {/* Top Bar */}
            <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/lesson/get-query-basics" className="text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors" title="Learning Dashboard">📡</Link>
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <Link href="/interview" className="text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors">← Challenges</Link>
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <h1 className="text-sm font-bold text-[var(--text-primary)]">{activeChallenge.title}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${DIFF_COLORS[activeChallenge.difficulty] || ''}`}>
                        {activeChallenge.difficulty}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Timer timeLimitMinutes={activeChallenge.timeLimitMinutes} startedAt={design.startedAt} submitted={submitted} />
                    {!submitted && (
                        <motion.button
                            onClick={submitDesign}
                            disabled={scoring || design.endpoints.length === 0}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {scoring ? '⏳ Scoring...' : '🚀 Submit Design'}
                        </motion.button>
                    )}
                    {submitted && (
                        <motion.button
                            onClick={resetDesign}
                            className="px-4 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-lg hover:bg-violet-500/10 hover:text-violet-400 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            🔄 Try Again
                        </motion.button>
                    )}
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
                    {/* Problem Statement */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">📋 Problem Statement</h2>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">{activeChallenge.problemStatement}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-emerald-400 mb-1.5">Functional Requirements</h3>
                                <ul className="space-y-1">
                                    {activeChallenge.functionalRequirements.map((r, i) => (
                                        <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                                            <span className="text-emerald-500/60">•</span>{r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-amber-400 mb-1.5">Constraints</h3>
                                <ul className="space-y-1">
                                    {activeChallenge.constraints.map((c, i) => (
                                        <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                                            <span className="text-amber-500/60">•</span>{c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Rubric */}
                        <div className="mt-4 pt-3 border-t border-[var(--border)]">
                            <h3 className="text-[10px] font-bold uppercase text-blue-400 mb-1.5">Scoring Rubric</h3>
                            <div className="flex flex-wrap gap-2">
                                {activeChallenge.rubric.map((r, i) => (
                                    <span key={i} className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                                        {r.category} ({r.maxPoints}pts)
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resource Schema */}
                    {activeChallenge.resourceSchema && activeChallenge.resourceSchema.length > 0 && (
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1">📦 Data Model — What fields does this resource have?</h2>
                            <p className="text-[10px] text-[var(--text-muted)] mb-3">
                                These are the fields your API needs to handle. Use them in your request/response bodies.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase text-[var(--text-muted)]">
                                            <th className="pb-1.5 pr-4">Field</th>
                                            <th className="pb-1.5 pr-4">Type</th>
                                            <th className="pb-1.5 pr-4">Required</th>
                                            <th className="pb-1.5">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {activeChallenge.resourceSchema.map((f, i) => (
                                            <tr key={i}>
                                                <td className="py-1.5 pr-4 font-mono text-[var(--text-primary)] font-medium">{f.field}</td>
                                                <td className="py-1.5 pr-4 text-violet-300 font-mono">{f.type}</td>
                                                <td className="py-1.5 pr-4">
                                                    {f.required ? (
                                                        <span className="text-emerald-400 text-[10px] font-bold">Required</span>
                                                    ) : (
                                                        <span className="text-[var(--text-muted)] text-[10px]">Optional</span>
                                                    )}
                                                </td>
                                                <td className="py-1.5 text-[var(--text-muted)] text-[11px]">{f.constraints || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Getting Started Guide — only show before submission */}
                    {!submitted && (
                        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-5 py-4">
                            <h2 className="text-xs font-bold text-violet-400 mb-2">🚀 How to approach this</h2>
                            <ol className="space-y-1.5 text-xs text-[var(--text-secondary)] list-decimal list-inside">
                                <li><strong>Read the requirements</strong> — understand what operations users need</li>
                                <li><strong>Study the data model</strong> above — these are the fields your endpoints will handle</li>
                                <li><strong>Add one endpoint at a time</strong> — start with the simplest (usually a GET to list items)</li>
                                <li><strong>Pick the right method</strong> — GET to read, POST to create, PUT/PATCH to update, DELETE to remove</li>
                                <li><strong>Think about what can go wrong</strong> — missing fields, items not found, invalid data</li>
                            </ol>
                        </div>
                    )}

                    {/* Score Report (after submission) */}
                    {report && <ScoreReportView report={report} rubric={activeChallenge.rubric} />}

                    {/* Defend Your Design (after submission) */}
                    {submitted && activeChallenge.defendQuestions && activeChallenge.defendQuestions.length > 0 && (
                        <DefendYourDesign questions={activeChallenge.defendQuestions} />
                    )}

                    {/* Design Workspace */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                🛠️ Your API Design
                            </h2>
                            {!submitted && (
                                <motion.button
                                    onClick={addEndpoint}
                                    className="px-3 py-1 text-xs font-medium text-violet-400 bg-violet-500/10 rounded-lg hover:bg-violet-500/20 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    + Add Endpoint
                                </motion.button>
                            )}
                        </div>

                        {/* Progress Indicator */}
                        {(() => {
                            const designed = design.endpoints.length;
                            const expected = activeChallenge.modelSolution.endpoints.length;
                            const pct = Math.min(100, Math.round((designed / expected) * 100));
                            return (
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                            {designed} of ~{expected} expected endpoints
                                        </span>
                                        <span className="text-[10px] text-[var(--text-muted)]">{pct}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="space-y-2">
                            <AnimatePresence>
                                {design.endpoints.map((ep, i) => (
                                    <EndpointEditor
                                        key={ep.id}
                                        endpoint={ep}
                                        index={i}
                                        onUpdate={(updates) => updateEndpoint(ep.id, updates)}
                                        onRemove={() => removeEndpoint(ep.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {design.endpoints.length === 0 && (
                            <div className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-xl p-8 text-center">
                                <p className="text-sm text-[var(--text-muted)] mb-2">No endpoints yet</p>
                                <button
                                    onClick={addEndpoint}
                                    className="text-xs text-violet-400 hover:underline"
                                >+ Add your first endpoint</button>
                            </div>
                        )}
                    </div>

                    {/* Model Solution */}
                    <ModelSolution challenge={activeChallenge} locked={!submitted} />
                </div>
            </div>
        </div>
    );
}
