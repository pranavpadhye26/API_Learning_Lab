'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LessonMeta, SimulateResponse, HttpMethod } from '@/lib/types';

interface RequestState {
    method: HttpMethod;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
}

interface LessonState {
    lessons: LessonMeta[];
    activeLessonId: string;
    activeLesson: LessonMeta | null;
    completedLessons: string[];
    request: RequestState;
    response: SimulateResponse | null;
    loading: boolean;
    breakItOn: boolean;
    setRequest: (req: RequestState) => void;
    updateRequest: (partial: Partial<RequestState>) => void;
    setBreakItOn: (on: boolean) => void;
    sendRequest: () => Promise<void>;
    markComplete: (lessonId: string) => void;
    resetProgress: () => void;
    progress: number;
}

export function useLessonState(lessonId: string): LessonState {
    const [lessons, setLessons] = useState<LessonMeta[]>([]);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [request, setRequest] = useState<RequestState>({
        method: 'GET',
        path: '/users',
        headers: {},
        query: {},
        body: '',
    });
    const [response, setResponse] = useState<SimulateResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [breakItOn, setBreakItOn] = useState(false);

    // Load lessons dynamically from API
    useEffect(() => {
        fetch('/api/lessons')
            .then(r => r.json())
            .then((data: LessonMeta[]) => setLessons(data))
            .catch(err => console.error('Failed to load lessons:', err));
    }, []);

    // Load completed from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('api-lab-completed');
            if (saved) setCompletedLessons(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Save completed to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('api-lab-completed', JSON.stringify(completedLessons));
        } catch { /* ignore */ }
    }, [completedLessons]);

    // Load last request for lesson when lessonId changes
    useEffect(() => {
        setResponse(null);
        setBreakItOn(false);

        try {
            const saved = localStorage.getItem('api-lab-requests');
            if (saved) {
                const map = JSON.parse(saved) as Record<string, RequestState>;
                if (map[lessonId]) {
                    setRequest(map[lessonId]);
                    return;
                }
            }
        } catch { /* ignore */ }

        // Fallback to lesson defaults
        const lesson = lessons.find(l => l.lessonId === lessonId);
        if (lesson) {
            setRequest({ ...lesson.defaultRequest });
        }
    }, [lessonId, lessons]);

    // Save request to localStorage on change
    useEffect(() => {
        try {
            const saved = localStorage.getItem('api-lab-requests');
            const map = saved ? JSON.parse(saved) : {};
            map[lessonId] = request;
            localStorage.setItem('api-lab-requests', JSON.stringify(map));
        } catch { /* ignore */ }
    }, [request, lessonId]);

    const activeLesson = lessons.find(l => l.lessonId === lessonId) || null;

    const updateRequest = useCallback((partial: Partial<RequestState>) => {
        setRequest(prev => ({ ...prev, ...partial }));
    }, []);

    const markComplete = useCallback((lessonIdToMark: string) => {
        setCompletedLessons(prev => {
            if (prev.includes(lessonIdToMark)) return prev;
            return [...prev, lessonIdToMark];
        });
    }, []);

    const resetProgress = useCallback(() => {
        setCompletedLessons([]);
        localStorage.removeItem('api-lab-completed');
        localStorage.removeItem('api-lab-requests');
        // Reset to default request
        const lesson = lessons.find(l => l.lessonId === lessonId);
        if (lesson) setRequest({ ...lesson.defaultRequest });
        setResponse(null);
    }, [lessons, lessonId]);

    const sendRequest = useCallback(async () => {
        setLoading(true);
        setResponse(null);
        try {
            const res = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    request,
                }),
            });
            const data: SimulateResponse = await res.json();
            setResponse(data);

            // Check for success
            if (data.http?.status && activeLesson?.successCodes.includes(data.http.status)) {
                markComplete(lessonId);
            }
        } catch (err) {
            console.error('Request failed:', err);
            setResponse({
                http: { status: 0, headers: {}, body: { error: 'Network error — could not reach the simulator.' }, latencyMs: 0 },
                trace: [{ stage: 'client', msg: 'Failed to reach simulator endpoint', ok: false }],
                teaching: {
                    title: 'Network Error',
                    explanation: 'The request could not be sent. This usually means the dev server is not running.',
                    fixSteps: ['Make sure the dev server is running with npm run dev'],
                    commonMistakes: [],
                },
            });
        } finally {
            setLoading(false);
        }
    }, [lessonId, request, activeLesson, markComplete]);

    const progress = lessons.length > 0 ? completedLessons.length / lessons.length : 0;

    return {
        lessons,
        activeLessonId: lessonId,
        activeLesson,
        completedLessons,
        request,
        response,
        loading,
        breakItOn,
        setRequest,
        updateRequest,
        setBreakItOn,
        sendRequest,
        markComplete,
        resetProgress,
        progress,
    };
}
