'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlowPanel from '@/components/FlowPanel';
import RequestBuilder from '@/components/RequestBuilder';
import ResponseViewer from '@/components/ResponseViewer';
import TeachingDrawer from '@/components/TeachingDrawer';
import SandboxConfig from '@/components/SandboxConfig';
import SandboxHistory from '@/components/SandboxHistory';
import { useSandboxState } from '@/hooks/useSandboxState';
import type { HttpMethod, LessonMeta } from '@/lib/types';
import type { SandboxSuggestion } from '@/lib/sandbox-types';

// Break It mistakes for sandbox mode
const SANDBOX_BREAK_IT_MISTAKES = [
    {
        label: 'Remove Auth Header',
        tooltip: 'Removes the Authorization header — many APIs will return 401',
        apply: { removeHeader: 'Authorization' },
    },
    {
        label: 'Invalid JSON Body',
        tooltip: 'Sets a malformed JSON body to trigger a 400 parse error',
        apply: { setBody: '{ name: broken, missing: quotes }' },
    },
    {
        label: 'Wrong Method (DELETE)',
        tooltip: 'Switches to DELETE — see how the API handles an unexpected method',
        apply: { setMethod: 'DELETE' as HttpMethod },
    },
    {
        label: 'Remove Content-Type',
        tooltip: 'Removes Content-Type header — server won\'t know your data format',
        apply: { removeHeader: 'Content-Type' },
    },
];

// Demo request used for "Try It Now" one-click experience
const DEMO_REQUEST: SandboxSuggestion = {
    method: 'GET',
    path: '/api/products',
    headers: {},
    query: { category: 'electronics', limit: '5' },
    body: '',
    label: 'GET /api/products?category=electronics',
};

export default function SandboxPage() {
    const state = useSandboxState();
    const [teachingOpen, setTeachingOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hasTriedOnce, setHasTriedOnce] = useState(false);
    const [breakItOn, setBreakItOn] = useState(false);

    // Ref to store request state before Break It is applied
    const preBreakRequest = useRef(state.request);

    // Build a dynamic pseudo-lesson that restores the CURRENT request on Fix It
    const sandboxLesson = useMemo<LessonMeta>(() => ({
        lessonId: 'sandbox',
        title: 'AI Sandbox',
        description: 'Free-form API sandbox',
        category: 'Sandbox',
        successCodes: [200, 201, 204],
        objective: '',
        willLearn: [],
        takeaways: [],
        interviewNotes: [],
        interviewExplanation: '',
        steps: [],
        defaultRequest: preBreakRequest.current,
        breakItMistakes: SANDBOX_BREAK_IT_MISTAKES,
    }), [breakItOn]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle suggestion clicks — populate the request builder (does NOT dismiss welcome)
    const handleSuggestionClick = useCallback((suggestion: SandboxSuggestion) => {
        state.setRequest({
            method: suggestion.method as HttpMethod,
            path: suggestion.path,
            headers: suggestion.headers,
            query: suggestion.query,
            body: suggestion.body,
        });
    }, [state]);

    // One-click "Try It Now" — fills AND sends a demo request
    const handleTryItNow = useCallback(() => {
        state.setRequest({
            method: DEMO_REQUEST.method as HttpMethod,
            path: DEMO_REQUEST.path,
            headers: DEMO_REQUEST.headers,
            query: DEMO_REQUEST.query,
            body: DEMO_REQUEST.body,
        });
        setHasTriedOnce(true);
        // Use rAF to ensure state has flushed to refs before sending
        requestAnimationFrame(() => {
            state.sendRequest();
        });
    }, [state]);

    // Extract highlights from trace (always empty for sandbox — no trace highlights)
    const highlights = useMemo(() => [], []);

    // Show welcome state only when user hasn't interacted yet and no response
    const showWelcome = !state.response && !state.isLoading && !hasTriedOnce;

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center text-sm"
                >
                    {sidebarOpen ? '✕' : '☰'}
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">⚡</div>
                    <span className="text-sm font-semibold">AI Sandbox</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-500/15 text-cyan-400 rounded-md border border-cyan-500/30">AI</span>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
                    <div className="w-72 h-full" onClick={e => e.stopPropagation()}>
                        <SandboxConfig
                            context={state.context}
                            customContext={state.customContext}
                            onContextChange={state.setContext}
                            onCustomContextChange={state.setCustomContext}
                            onSuggestionClick={(s) => {
                                handleSuggestionClick(s);
                                setSidebarOpen(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-col h-full">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <SandboxConfig
                        context={state.context}
                        customContext={state.customContext}
                        onContextChange={state.setContext}
                        onCustomContextChange={state.setCustomContext}
                        onSuggestionClick={handleSuggestionClick}
                    />
                </div>
                {/* History appended to bottom of sidebar */}
                <SandboxHistory
                    history={state.history}
                    onSelect={state.loadFromHistory}
                    onClear={state.clearHistory}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Custom Top Bar */}
                <header className="h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-5 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">API Sandbox</h2>
                                <motion.span
                                    className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-full border border-cyan-500/30"
                                    animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 8px rgba(6,182,212,0.3)', '0 0 0px rgba(6,182,212,0)'] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                >
                                    ⚡ AI-Powered
                                </motion.span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">Send any request, get intelligent responses</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Loading indicator */}
                        <AnimatePresence>
                            {state.isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
                                >
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-cyan-400"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                    />
                                    <span className="text-[10px] font-medium text-cyan-400">AI is thinking...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Home link */}
                        <motion.a
                            href="/"
                            className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-hover)] rounded-lg hover:text-[var(--text-primary)] transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ← Home
                        </motion.a>
                    </div>
                </header>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 pb-6">

                    {/* ═══ WELCOME HERO STATE ═══ */}
                    <AnimatePresence>
                        {showWelcome && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                transition={{ duration: 0.4 }}
                                className="bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-violet-500/5 border border-cyan-500/20 rounded-2xl p-8 text-center"
                            >
                                <motion.div
                                    className="text-4xl mb-4"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                >
                                    👋
                                </motion.div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Welcome to the AI Sandbox</h2>
                                <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto mb-6 leading-relaxed">
                                    This is your AI-powered API playground. Send any request to any endpoint — the AI will simulate a realistic server and teach you what happened.
                                </p>

                                {/* 3-Step Visual Guide */}
                                <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
                                    {[
                                        { step: '1', label: 'Pick an API', desc: 'Choose a context from the sidebar', icon: '🎯' },
                                        { step: '2', label: 'Build a Request', desc: 'Set method, path, headers & body', icon: '🔧' },
                                        { step: '3', label: 'Hit Send', desc: 'AI generates a realistic response', icon: '⚡' },
                                    ].map((s, i) => (
                                        <motion.div
                                            key={s.step}
                                            className="flex items-center gap-3"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.15 }}
                                        >
                                            {i > 0 && <span className="text-[var(--text-muted)] text-lg hidden sm:block">→</span>}
                                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-center min-w-[140px]">
                                                <span className="text-xl block mb-1">{s.icon}</span>
                                                <span className="text-xs font-bold text-[var(--text-primary)] block">{s.label}</span>
                                                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{s.desc}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* One-Click Try It */}
                                <motion.button
                                    onClick={handleTryItNow}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                                    whileHover={{ scale: 1.04, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="text-lg">⚡</span> Try It Now — One Click Demo
                                </motion.button>
                                <p className="text-[10px] text-[var(--text-muted)] mt-3">
                                    Sends <code className="px-1.5 py-0.5 bg-[var(--surface)] rounded text-emerald-400">GET /api/products?category=electronics</code> to the AI and shows you the full experience
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Compact AI notice (shown after first interaction) */}
                    {!showWelcome && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3"
                        >
                            <span className="text-sm flex-shrink-0">🤖</span>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                <span className="font-semibold text-cyan-400">AI Sandbox</span> — Pick a context from the sidebar, build any request, hit Send. Click <span className="font-semibold text-violet-400">✨ Explain</span> on the response to learn what happened.
                            </p>
                        </motion.div>
                    )}

                    {/* Error banner */}
                    <AnimatePresence>
                        {state.error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400"
                            >
                                ⚠ {state.error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 3-Pane Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-3">
                        {/* Left: Flow Panel */}
                        <div>
                            {!state.response && !state.isLoading ? (
                                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 h-full flex flex-col items-center justify-center text-center min-h-[200px]">
                                    <span className="text-2xl mb-2">📡</span>
                                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Request Flow</p>
                                    <p className="text-[10px] text-[var(--text-muted)] max-w-[200px]">
                                        Your request&apos;s journey through the server will appear here after you send it
                                    </p>
                                </div>
                            ) : (
                                <FlowPanel
                                    trace={state.response?.trace || null}
                                    loading={state.isLoading}
                                />
                            )}
                        </div>

                        {/* Center: Request Builder */}
                        <RequestBuilder
                            method={state.request.method}
                            path={state.request.path}
                            headers={state.request.headers}
                            query={state.request.query}
                            body={state.request.body}
                            loading={state.isLoading}
                            breakItOn={breakItOn}
                            activeLesson={sandboxLesson}
                            highlights={highlights}
                            onUpdateRequest={state.updateRequest}
                            onSend={() => {
                                setHasTriedOnce(true);
                                state.sendRequest();
                            }}
                            onBreakItToggle={(on) => {
                                if (on) {
                                    // Save current request before breaking it
                                    preBreakRequest.current = { ...state.request };
                                }
                                setBreakItOn(on);
                            }}
                        />

                        {/* Right: Response Viewer */}
                        {state.isLoading && !state.response ? (
                            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] h-full flex items-center justify-center min-h-[200px]">
                                <div className="text-center">
                                    <motion.div
                                        className="text-3xl mb-3"
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                    >
                                        ⚡
                                    </motion.div>
                                    <p className="text-xs text-cyan-400 font-medium">AI is simulating...</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Generating realistic response</p>
                                </div>
                            </div>
                        ) : !state.response ? (
                            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 h-full flex flex-col items-center justify-center text-center min-h-[200px]">
                                <span className="text-2xl mb-2">🤖</span>
                                <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">AI Response</p>
                                <p className="text-[10px] text-[var(--text-muted)] max-w-[200px]">
                                    The AI-generated response with status code, headers, and body will appear here
                                </p>
                            </div>
                        ) : (
                            <ResponseViewer
                                response={state.response}
                                onExplain={() => setTeachingOpen(true)}
                            />
                        )}
                    </div>

                    {/* Mobile History (shown below grid on mobile) */}
                    <div className="lg:hidden">
                        <SandboxHistory
                            history={state.history}
                            onSelect={state.loadFromHistory}
                            onClear={state.clearHistory}
                        />
                    </div>
                </div>
            </div>

            {/* Teaching Drawer */}
            <TeachingDrawer
                open={teachingOpen}
                teaching={state.response?.teaching || null}
                status={state.response?.http.status}
                onClose={() => setTeachingOpen(false)}
            />
        </div>
    );
}
