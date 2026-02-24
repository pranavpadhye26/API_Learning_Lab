'use client';

import { useState, useEffect, useCallback } from 'react';
import type { InterviewChallenge, UserDesign, UserEndpoint, ScoreReport, InterviewAttempt } from '@/lib/interview-types';

interface UseInterviewReturn {
    challenges: InterviewChallenge[];
    activeChallenge: InterviewChallenge | null;
    design: UserDesign;
    report: ScoreReport | null;
    submitted: boolean;
    loading: boolean;
    scoring: boolean;
    attempts: InterviewAttempt[];
    addEndpoint: () => void;
    removeEndpoint: (id: string) => void;
    updateEndpoint: (id: string, updates: Partial<UserEndpoint>) => void;
    submitDesign: () => Promise<void>;
    resetDesign: () => void;
}

let endpointCounter = 0;

function createEmptyEndpoint(): UserEndpoint {
    return {
        id: `ep-${Date.now()}-${endpointCounter++}`,
        method: 'GET',
        path: '/',
        description: '',
        queryParams: [],
        headers: [],
        requestBody: '',
        responseBody: '',
        statusCodes: [200],
        errorCases: [],
    };
}

export function useInterviewState(challengeId?: string): UseInterviewReturn {
    const [challenges, setChallenges] = useState<InterviewChallenge[]>([]);
    const [design, setDesign] = useState<UserDesign>({
        challengeId: challengeId || '',
        endpoints: [createEmptyEndpoint()],
        startedAt: Date.now(),
    });
    const [report, setReport] = useState<ScoreReport | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scoring, setScoring] = useState(false);
    const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);

    // Load challenges
    useEffect(() => {
        fetch('/api/challenges')
            .then(r => r.json())
            .then(data => { setChallenges(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Load past attempts
    useEffect(() => {
        try {
            const saved = localStorage.getItem('api-lab-interview-attempts');
            if (saved) setAttempts(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Reset design when challengeId changes
    useEffect(() => {
        if (challengeId) {
            setDesign({
                challengeId,
                endpoints: [createEmptyEndpoint()],
                startedAt: Date.now(),
            });
            setReport(null);
            setSubmitted(false);
        }
    }, [challengeId]);

    const activeChallenge = challenges.find(c => c.id === challengeId) || null;

    const addEndpoint = useCallback(() => {
        setDesign(prev => ({
            ...prev,
            endpoints: [...prev.endpoints, createEmptyEndpoint()],
        }));
    }, []);

    const removeEndpoint = useCallback((id: string) => {
        setDesign(prev => ({
            ...prev,
            endpoints: prev.endpoints.filter(ep => ep.id !== id),
        }));
    }, []);

    const updateEndpoint = useCallback((id: string, updates: Partial<UserEndpoint>) => {
        setDesign(prev => ({
            ...prev,
            endpoints: prev.endpoints.map(ep =>
                ep.id === id ? { ...ep, ...updates } : ep
            ),
        }));
    }, []);

    const submitDesign = useCallback(async () => {
        if (!challengeId) return;
        setScoring(true);

        const finalDesign: UserDesign = {
            ...design,
            submittedAt: Date.now(),
            timeSpentSeconds: Math.round((Date.now() - design.startedAt) / 1000),
        };

        try {
            const resp = await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeId, design: finalDesign }),
            });
            const scoreReport = await resp.json() as ScoreReport;

            setReport(scoreReport);
            setSubmitted(true);
            setDesign(finalDesign);

            // Save attempt
            const attempt: InterviewAttempt = {
                challengeId,
                design: finalDesign,
                report: scoreReport,
                savedAt: Date.now(),
            };
            const updated = [...attempts, attempt];
            setAttempts(updated);
            localStorage.setItem('api-lab-interview-attempts', JSON.stringify(updated));
        } catch (err) {
            console.error('Scoring failed:', err);
        } finally {
            setScoring(false);
        }
    }, [challengeId, design, attempts]);

    const resetDesign = useCallback(() => {
        setDesign({
            challengeId: challengeId || '',
            endpoints: [createEmptyEndpoint()],
            startedAt: Date.now(),
        });
        setReport(null);
        setSubmitted(false);
    }, [challengeId]);

    return {
        challenges,
        activeChallenge,
        design,
        report,
        submitted,
        loading,
        scoring,
        attempts,
        addEndpoint,
        removeEndpoint,
        updateEndpoint,
        submitDesign,
        resetDesign,
    };
}
