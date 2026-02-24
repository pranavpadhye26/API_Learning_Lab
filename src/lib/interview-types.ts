import type { HttpMethod } from './types';

// ─── Challenge Definition (stored as JSON) ─────────────────

export interface RubricCategory {
    category: string;
    maxPoints: number;
    criteria: string[];
    reasoning?: string;
}

export interface DefendQuestion {
    id: string;
    question: string;
    modelReasoning: string;
}

export interface ModelEndpoint {
    method: HttpMethod;
    path: string;
    description: string;
    queryParams?: string[];
    headers?: string[];
    requestBody?: Record<string, unknown>;
    responseBody?: Record<string, unknown>;
    statusCodes: number[];
    errorCases: string[];
}

export interface ResourceField {
    field: string;
    type: string;
    required?: boolean;
    constraints?: string;
}

export interface InterviewChallenge {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeLimitMinutes: number;
    problemStatement: string;
    functionalRequirements: string[];
    constraints: string[];
    rubric: RubricCategory[];
    defendQuestions?: DefendQuestion[];
    resourceSchema?: ResourceField[];
    modelSolution: {
        endpoints: ModelEndpoint[];
        designNotes: string[];
    };
}

// ─── User's Design (built in the workspace) ────────────────

export interface UserEndpoint {
    id: string;
    method: HttpMethod;
    path: string;
    description: string;
    queryParams: string[];
    headers: string[];
    requestBody: string; // JSON string
    responseBody: string; // JSON string
    statusCodes: number[];
    errorCases: string[];
}

export interface UserDesign {
    challengeId: string;
    endpoints: UserEndpoint[];
    startedAt: number;
    submittedAt?: number;
    timeSpentSeconds?: number;
}

// ─── Score Report ───────────────────────────────────────────

export interface CategoryScore {
    category: string;
    maxPoints: number;
    earnedPoints: number;
    feedback: string[];
}

export interface ScoreReport {
    challengeId: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    categories: CategoryScore[];
    summary: string;
    strengths: string[];
    improvements: string[];
    submittedAt: number;
}

// ─── Persisted Attempt ──────────────────────────────────────

export interface InterviewAttempt {
    challengeId: string;
    design: UserDesign;
    report: ScoreReport;
    savedAt: number;
}
