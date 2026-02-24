'use client';

import { useState, useMemo, use, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import LessonSidebar from '@/components/LessonSidebar';
import TopBar from '@/components/TopBar';
import FlowPanel from '@/components/FlowPanel';
import RequestBuilder from '@/components/RequestBuilder';
import ResponseViewer from '@/components/ResponseViewer';
import TeachingDrawer from '@/components/TeachingDrawer';
import GuidedTour from '@/components/GuidedTour';
import LessonOverview from '@/components/LessonOverview';
import LessonStepsPanel from '@/components/LessonStepsPanel';
import LessonRecap from '@/components/LessonRecap';
import TradeoffCards from '@/components/TradeoffCards';
import { useLessonState } from '@/hooks/useLessonState';
import type { TraceStep } from '@/lib/types';

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = use(params);
    const state = useLessonState(lessonId);
    const searchParams = useSearchParams();
    const [teachingOpen, setTeachingOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const hasAutoOpenedTeaching = useRef(false);

    // Show guided tour if ?tour=true or if user never completed it
    useEffect(() => {
        const tourParam = searchParams.get('tour');
        const done = localStorage.getItem('api-lab-guided-tour-done');
        if (tourParam === 'true' || done !== 'true') {
            setShowTour(true);
        }
    }, [searchParams]);

    // Extract highlights from latest trace
    const highlights = useMemo(() => {
        if (!state.response?.trace) return [];
        return state.response.trace
            .filter((t: TraceStep) => t.highlight)
            .map((t: TraceStep) => t.highlight!);
    }, [state.response]);

    // Auto-open teaching drawer on first response per lesson
    useEffect(() => {
        if (!state.response || hasAutoOpenedTeaching.current) return;
        try {
            const key = `api-lab-teaching-seen-${lessonId}`;
            if (localStorage.getItem(key) !== 'true') {
                setTeachingOpen(true);
                localStorage.setItem(key, 'true');
            }
        } catch { /* ignore */ }
        hasAutoOpenedTeaching.current = true;
    }, [state.response, lessonId]);

    // Reset auto-open flag when lesson changes
    useEffect(() => {
        hasAutoOpenedTeaching.current = false;
    }, [lessonId]);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
            {/* Guided Tour */}
            {showTour && (
                <GuidedTour onComplete={() => setShowTour(false)} />
            )}

            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center text-sm"
                >
                    {sidebarOpen ? '✕' : '☰'}
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">A</div>
                    <span className="text-sm font-semibold truncate">{state.activeLesson?.title || 'Loading...'}</span>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
                    <div className="w-72 h-full" onClick={e => e.stopPropagation()}>
                        <LessonSidebar
                            lessons={state.lessons}
                            activeLessonId={state.activeLessonId}
                            completedLessons={state.completedLessons}
                            onMobileClose={() => setSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <LessonSidebar
                    lessons={state.lessons}
                    activeLessonId={state.activeLessonId}
                    completedLessons={state.completedLessons}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <TopBar
                    title={state.activeLesson?.title || 'Select a lesson'}
                    description={state.activeLesson?.description || ''}
                    progress={state.progress}
                    completedCount={state.completedLessons.length}
                    totalCount={state.lessons.length}
                    onReset={state.resetProgress}
                    onHelp={() => {
                        localStorage.removeItem('api-lab-guided-tour-done');
                        setShowTour(true);
                    }}
                />

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 pb-6">
                    {/* Lesson Overview — shown at top */}
                    {state.activeLesson && (
                        <LessonOverview lesson={state.activeLesson} />
                    )}

                    {/* 3-Pane Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-3">
                        {/* Left: Flow Panel */}
                        <FlowPanel
                            trace={state.response?.trace || null}
                            loading={state.loading}
                        />

                        {/* Center: Request Builder */}
                        <RequestBuilder
                            method={state.request.method}
                            path={state.request.path}
                            headers={state.request.headers}
                            query={state.request.query}
                            body={state.request.body}
                            loading={state.loading}
                            breakItOn={state.breakItOn}
                            activeLesson={state.activeLesson}
                            highlights={highlights}
                            onUpdateRequest={state.updateRequest}
                            onSend={state.sendRequest}
                            onBreakItToggle={state.setBreakItOn}
                        />

                        {/* Right: Response Viewer */}
                        <ResponseViewer
                            response={state.response}
                            onExplain={() => setTeachingOpen(true)}
                        />
                    </div>

                    {/* Guided Steps — full width below the grid */}
                    {state.activeLesson && state.activeLesson.steps?.length > 0 && (
                        <LessonStepsPanel
                            lessonId={lessonId}
                            steps={state.activeLesson.steps}
                            response={state.response}
                            sandboxPrompts={state.activeLesson.sandboxPrompts}
                            currentRequest={{
                                method: state.request.method,
                                query: state.request.query,
                            }}
                        />
                    )}

                    {/* Tradeoff Cards — between steps and recap */}
                    {state.activeLesson?.tradeoffCards && state.activeLesson.tradeoffCards.length > 0 && (
                        <TradeoffCards cards={state.activeLesson.tradeoffCards} />
                    )}

                    {/* Lesson Recap — at the bottom */}
                    {state.activeLesson && (
                        <LessonRecap lesson={state.activeLesson} />
                    )}
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
