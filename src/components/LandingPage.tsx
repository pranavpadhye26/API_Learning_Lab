'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const FEATURES = [
    {
        icon: '🔧',
        title: 'Interactive Request Builder',
        desc: 'Build real HTTP requests — pick methods, set headers, query params, and JSON bodies. See exactly what gets sent.',
        gradient: 'from-violet-500/20 to-indigo-500/20',
        border: 'border-violet-500/20',
    },
    {
        icon: '🔄',
        title: 'Animated Flow Traces',
        desc: 'Watch your request travel through every server stage: client → auth → validation → service → database → response.',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-500/20',
    },
    {
        icon: '📖',
        title: 'Teaching Explanations',
        desc: 'Every response is explained — what happened, why, common mistakes, and how to fix errors. Learn by doing.',
        gradient: 'from-amber-500/20 to-orange-500/20',
        border: 'border-amber-500/20',
    },
    {
        icon: '🎯',
        title: 'Interview Prep Mode',
        desc: 'Practice API design challenges with timed sessions, rubric-based scoring, and model solutions to compare against.',
        gradient: 'from-rose-500/20 to-pink-500/20',
        border: 'border-rose-500/20',
    },
];

const STEPS = [
    {
        num: '01',
        title: 'Pick a Lesson',
        desc: 'Choose from topics like GET queries, POST validation, authentication, pagination, and CORS.',
        icon: '📚',
    },
    {
        num: '02',
        title: 'Build & Send Requests',
        desc: 'Construct HTTP requests in the sandbox. Tweak methods, paths, headers, and bodies — then hit Send.',
        icon: '▶️',
    },
    {
        num: '03',
        title: 'Watch & Learn',
        desc: 'See the animated flow trace, read the explanation, and complete guided steps to master each concept.',
        icon: '🎓',
    },
];

const LESSON_TOPICS = [
    { label: 'GET & Query Params', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    { label: 'POST & Validation', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    { label: 'Bearer Auth', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
    { label: 'Pagination & Filtering', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    { label: 'CORS & Preflight', color: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] overflow-x-hidden">
            {/* ─── Nav ─── */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg)]/80 border-b border-[var(--border)]">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet-500/25">
                            A
                        </div>
                        <span className="text-base font-bold tracking-tight">API Learning Lab</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/interview">
                            <motion.span
                                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                whileHover={{ y: -1 }}
                            >
                                Interview Prep
                            </motion.span>
                        </Link>
                        <Link href="/lesson/get-query-basics?tour=true">
                            <motion.span
                                className="px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 inline-block"
                                whileHover={{ scale: 1.03, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Start Learning →
                            </motion.span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative pt-24 pb-20 px-6">
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-violet-600/8 via-indigo-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <span className="inline-block px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
                            Interactive API Tutorials
                        </span>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-7xl font-black leading-[1.08] tracking-tight mb-6"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                    >
                        Learn APIs by{' '}
                        <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            actually building
                        </span>{' '}
                        requests
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                    >
                        No dry docs. Build real HTTP requests, watch them flow through server stages,
                        and get instant explanations. Master REST APIs from fundamentals to auth.
                    </motion.p>

                    <motion.div
                        className="flex flex-wrap items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.6 }}
                    >
                        <Link href="/lesson/get-query-basics?tour=true">
                            <motion.span
                                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25 cursor-pointer"
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-lg">▶</span> Start Learning
                            </motion.span>
                        </Link>
                        <Link href="/interview">
                            <motion.span
                                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-violet-500/30 transition-all cursor-pointer"
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-lg">🎯</span> Interview Prep
                            </motion.span>
                        </Link>
                    </motion.div>
                </div>

                {/* Terminal preview */}
                <motion.div
                    className="relative max-w-3xl mx-auto mt-16"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/40">
                        {/* Terminal header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface-hover)] border-b border-[var(--border)]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] ml-2 font-mono">API Learning Lab — Request Sandbox</span>
                        </div>
                        {/* Terminal content */}
                        <div className="p-6 font-mono text-sm leading-relaxed space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold">GET</span>
                                <span className="text-[var(--text-secondary)]">/api/users?page=1&limit=10</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <span>→</span>
                                <span className="text-violet-400">Authorization:</span>
                                <span>Bearer demo-token</span>
                            </div>
                            <div className="h-px bg-[var(--border)] my-2" />
                            <div className="flex items-center gap-2">
                                <motion.span
                                    className="text-emerald-400 font-bold"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    200
                                </motion.span>
                                <span className="text-emerald-400/60">OK</span>
                                <span className="text-[var(--text-muted)] text-xs ml-auto">142ms</span>
                            </div>
                            <pre className="text-xs text-[var(--text-muted)] bg-[var(--bg)] rounded-lg p-3 overflow-hidden">
                                {`{
  "users": [{ "id": 1, "name": "Alice" }, ...],
  "total": 42,
  "page": 1,
  "totalPages": 5
}`}
                            </pre>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ─── Topics ─── */}
            <section className="py-6 px-6">
                <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2">
                    {LESSON_TOPICS.map((t, i) => (
                        <motion.span
                            key={t.label}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border ${t.color}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.07 }}
                        >
                            {t.label}
                        </motion.span>
                    ))}
                </div>
            </section>

            {/* ─── Features ─── */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 block mb-3">Why API Learning Lab?</span>
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Everything you need to master REST APIs</h2>
                        <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
                            Built for hands-on learners who want to understand APIs by experimenting, not just reading.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={f.title}
                                className={`group relative bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-7 hover:scale-[1.02] transition-transform duration-300`}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-40px' }}
                                variants={fadeUp}
                                custom={i + 1}
                            >
                                <span className="text-3xl mb-4 block">{f.icon}</span>
                                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={fadeUp}
                        custom={0}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-3">How It Works</span>
                        <h2 className="text-3xl md:text-4xl font-black">Three steps to API mastery</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STEPS.map((s, i) => (
                            <motion.div
                                key={s.num}
                                className="relative text-center"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-40px' }}
                                variants={fadeUp}
                                custom={i + 1}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-2xl mx-auto mb-5 shadow-lg">
                                    {s.icon}
                                </div>
                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1.5">{s.num}</span>
                                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
                                {/* Connector */}
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-8 -right-4 w-8 text-[var(--text-muted)] text-lg">→</div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <motion.div
                    className="max-w-2xl mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={0}
                >
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to start building?</h2>
                    <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                        Jump in with a guided tour that walks you through every part of the sandbox. No signup needed.
                    </p>
                    <Link href="/lesson/get-query-basics?tour=true">
                        <motion.span
                            className="inline-flex items-center gap-2 px-10 py-4 text-sm font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25 cursor-pointer"
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="text-lg">🚀</span> Get Started — It&apos;s Free
                        </motion.span>
                    </Link>
                </motion.div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-[var(--border)] py-8 px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                            A
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">API Learning Lab</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">Built for learning APIs interactively</p>
                </div>
            </footer>
        </div>
    );
}
