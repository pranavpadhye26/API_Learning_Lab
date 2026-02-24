import type { InterviewChallenge, UserDesign, ScoreReport, CategoryScore, UserEndpoint, ModelEndpoint } from './interview-types';

/**
 * Auto-scoring engine that compares a user's API design against the model solution rubric.
 */
export function scoreDesign(challenge: InterviewChallenge, design: UserDesign): ScoreReport {
    const categories: CategoryScore[] = challenge.rubric.map(rubricCat => {
        switch (rubricCat.category) {
            case 'Endpoint Coverage':
                return scoreEndpointCoverage(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'HTTP Methods':
                return scoreHttpMethods(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'Status Codes':
                return scoreStatusCodes(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'Error Handling':
                return scoreErrorHandling(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'Request/Response Design':
                return scoreRequestResponse(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'Authentication':
                return scoreAuthentication(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'Pagination':
                return scorePagination(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            case 'Query Parameters':
                return scoreQueryParams(rubricCat.maxPoints, rubricCat.criteria, challenge, design);
            default:
                return scoreGeneric(rubricCat.maxPoints, rubricCat.category, rubricCat.criteria, challenge, design);
        }
    });

    const totalScore = categories.reduce((sum, c) => sum + c.earnedPoints, 0);
    const maxScore = categories.reduce((sum, c) => sum + c.maxPoints, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const grade = percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';

    const strengths: string[] = [];
    const improvements: string[] = [];

    for (const cat of categories) {
        const pct = cat.maxPoints > 0 ? cat.earnedPoints / cat.maxPoints : 0;
        if (pct >= 0.8) strengths.push(`Strong ${cat.category.toLowerCase()} — ${cat.earnedPoints}/${cat.maxPoints}`);
        if (pct < 0.6) improvements.push(`Improve ${cat.category.toLowerCase()} — ${cat.feedback[0] || 'Review the model solution'}`);
    }

    const summary = percentage >= 80
        ? `Excellent design! You covered ${percentage}% of the rubric criteria. Your API design demonstrates strong understanding of REST principles.`
        : percentage >= 60
            ? `Good attempt — ${percentage}% coverage. You have the fundamentals but missed some important design aspects. Review the model solution for gaps.`
            : percentage >= 40
                ? `Partial design — ${percentage}% coverage. Several key areas need attention. Focus on the improvement areas listed below and try again.`
                : `Early stage — ${percentage}% coverage. Take time to review REST API design principles and study the model solution before your next attempt.`;

    return {
        challengeId: challenge.id,
        totalScore,
        maxScore,
        percentage,
        grade,
        categories,
        summary,
        strengths,
        improvements,
        submittedAt: Date.now(),
    };
}

// ─── Category Scorers ───────────────────────────────────────

function scoreEndpointCoverage(maxPoints: number, _criteria: string[], challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const model = challenge.modelSolution.endpoints;
    const user = design.endpoints;
    const feedback: string[] = [];

    // Check how many model endpoints are covered
    let matched = 0;
    const missing: string[] = [];

    for (const mep of model) {
        const found = user.some(uep => pathMatches(uep.path, mep.path) && uep.method === mep.method);
        if (found) matched++;
        else missing.push(`${mep.method} ${mep.path}`);
    }

    const coverage = model.length > 0 ? matched / model.length : 0;
    const earned = Math.round(coverage * maxPoints);

    if (missing.length > 0) {
        feedback.push(`Missing endpoints: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}`);
    }
    if (matched === model.length) {
        feedback.push('All required endpoints are present');
    }

    // Bonus check: did user add extra endpoints?
    const extras = user.filter(uep => !model.some(mep => pathMatches(uep.path, mep.path) && uep.method === mep.method));
    if (extras.length > 0 && extras.length <= 2) {
        feedback.push(`Nice: you added ${extras.length} additional endpoint(s) beyond the requirements`);
    } else if (extras.length > 3) {
        feedback.push(`You have ${extras.length} extra endpoints — consider if all are necessary (over-engineering risk)`);
    }

    return { category: 'Endpoint Coverage', maxPoints, earnedPoints: earned, feedback };
}

function scoreHttpMethods(maxPoints: number, _criteria: string[], challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const model = challenge.modelSolution.endpoints;
    const user = design.endpoints;
    const feedback: string[] = [];

    let correctMethods = 0;
    let total = 0;

    for (const mep of model) {
        const match = user.find(uep => pathMatches(uep.path, mep.path));
        if (match) {
            total++;
            if (match.method === mep.method) correctMethods++;
            else feedback.push(`${match.path}: expected ${mep.method}, you used ${match.method}`);
        }
    }

    const ratio = total > 0 ? correctMethods / total : 0;
    const earned = Math.round(ratio * maxPoints);

    if (correctMethods === total && total > 0) feedback.push('All HTTP methods correctly chosen');

    return { category: 'HTTP Methods', maxPoints, earnedPoints: earned, feedback };
}

function scoreStatusCodes(maxPoints: number, _criteria: string[], challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const model = challenge.modelSolution.endpoints;
    const user = design.endpoints;
    const feedback: string[] = [];

    let totalExpected = 0;
    let totalCovered = 0;

    for (const mep of model) {
        const match = user.find(uep => pathMatches(uep.path, mep.path) && uep.method === mep.method);
        if (match) {
            for (const code of mep.statusCodes) {
                totalExpected++;
                if (match.statusCodes.includes(code)) totalCovered++;
                else feedback.push(`${mep.method} ${mep.path}: missing status ${code}`);
            }
        }
    }

    // Cap feedback
    if (feedback.length > 3) {
        const extra = feedback.length - 3;
        feedback.splice(3, extra, `...and ${extra} more missing status codes`);
    }

    const ratio = totalExpected > 0 ? totalCovered / totalExpected : 0;
    const earned = Math.round(ratio * maxPoints);

    return { category: 'Status Codes', maxPoints, earnedPoints: earned, feedback };
}

function scoreErrorHandling(maxPoints: number, _criteria: string[], challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const model = challenge.modelSolution.endpoints;
    const user = design.endpoints;
    const feedback: string[] = [];

    let totalCases = 0;
    let coveredCases = 0;

    for (const mep of model) {
        const match = user.find(uep => pathMatches(uep.path, mep.path) && uep.method === mep.method);
        if (match) {
            for (const errCase of mep.errorCases) {
                totalCases++;
                // Fuzzy match — check if user listed something similar
                const found = match.errorCases.some(ue => fuzzyMatch(ue, errCase));
                if (found) coveredCases++;
                else feedback.push(`Missing error case for ${mep.method} ${mep.path}: "${errCase}"`);
            }
        }
    }

    if (feedback.length > 3) {
        const extra = feedback.length - 3;
        feedback.splice(3, extra, `...and ${extra} more missing error cases`);
    }

    const ratio = totalCases > 0 ? coveredCases / totalCases : 0;
    const earned = Math.round(ratio * maxPoints);

    if (coveredCases === totalCases && totalCases > 0) feedback.push('All error cases covered');

    return { category: 'Error Handling', maxPoints, earnedPoints: earned, feedback };
}

function scoreRequestResponse(maxPoints: number, _criteria: string[], challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const model = challenge.modelSolution.endpoints;
    const user = design.endpoints;
    const feedback: string[] = [];

    let score = 0;
    let checks = 0;

    for (const mep of model) {
        const match = user.find(uep => pathMatches(uep.path, mep.path) && uep.method === mep.method);
        if (match) {
            // Check request body
            if (mep.requestBody) {
                checks++;
                try {
                    const userBody = match.requestBody.trim() ? JSON.parse(match.requestBody) : null;
                    if (userBody && typeof userBody === 'object') {
                        const modelKeys = Object.keys(mep.requestBody);
                        const userKeys = Object.keys(userBody);
                        const covered = modelKeys.filter(k => userKeys.includes(k)).length;
                        score += covered / Math.max(modelKeys.length, 1);
                    } else {
                        feedback.push(`${mep.method} ${mep.path}: request body schema is empty or invalid`);
                    }
                } catch {
                    feedback.push(`${mep.method} ${mep.path}: request body is not valid JSON`);
                }
            }
            // Check response body
            if (mep.responseBody) {
                checks++;
                try {
                    const userResp = match.responseBody.trim() ? JSON.parse(match.responseBody) : null;
                    if (userResp && typeof userResp === 'object') {
                        score += 1; // Give credit for having a response schema
                    } else {
                        feedback.push(`${mep.method} ${mep.path}: response body schema is empty`);
                    }
                } catch {
                    feedback.push(`${mep.method} ${mep.path}: response body is not valid JSON`);
                }
            }
        }
    }

    const ratio = checks > 0 ? score / checks : 0;
    const earned = Math.round(ratio * maxPoints);

    return { category: 'Request/Response Design', maxPoints, earnedPoints: earned, feedback };
}

function scoreAuthentication(maxPoints: number, _criteria: string[], _challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const feedback: string[] = [];

    const hasAuthEndpoints = design.endpoints.some(ep =>
        ep.headers.some(h => h.toLowerCase().includes('authorization') || h.toLowerCase().includes('auth'))
    );

    const hasAuthErrors = design.endpoints.some(ep =>
        ep.statusCodes.includes(401) || ep.statusCodes.includes(403)
    );

    let earned = 0;
    if (hasAuthEndpoints) {
        earned += Math.round(maxPoints * 0.6);
        feedback.push('Authorization header included');
    } else {
        feedback.push('Missing Authorization header on protected endpoints');
    }

    if (hasAuthErrors) {
        earned += Math.round(maxPoints * 0.4);
        feedback.push('Authentication error codes (401/403) included');
    } else {
        feedback.push('Missing 401/403 status codes for auth failures');
    }

    return { category: 'Authentication', maxPoints, earnedPoints: Math.min(earned, maxPoints), feedback };
}

function scorePagination(maxPoints: number, _criteria: string[], _challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const feedback: string[] = [];

    const hasPaginationParams = design.endpoints.some(ep =>
        ep.queryParams.some(p => ['page', 'limit', 'offset', 'cursor', 'per_page', 'page_size'].includes(p.toLowerCase()))
    );

    const hasPaginationResponse = design.endpoints.some(ep => {
        try {
            const body = ep.responseBody ? JSON.parse(ep.responseBody) : null;
            if (body && typeof body === 'object') {
                const keys = Object.keys(body).map(k => k.toLowerCase());
                return keys.some(k => ['total', 'totalPages', 'total_pages', 'page', 'has_next', 'hasNext', 'next_cursor'].includes(k));
            }
        } catch { /* ignore */ }
        return false;
    });

    let earned = 0;
    if (hasPaginationParams) {
        earned += Math.round(maxPoints * 0.5);
        feedback.push('Pagination query parameters included');
    } else {
        feedback.push('Missing pagination parameters (page, limit, offset, or cursor)');
    }

    if (hasPaginationResponse) {
        earned += Math.round(maxPoints * 0.5);
        feedback.push('Pagination metadata in response');
    } else {
        feedback.push('Consider including pagination metadata in list responses (total, totalPages, etc.)');
    }

    return { category: 'Pagination', maxPoints, earnedPoints: Math.min(earned, maxPoints), feedback };
}

function scoreQueryParams(maxPoints: number, _criteria: string[], challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    const model = challenge.modelSolution.endpoints;
    const feedback: string[] = [];
    let totalExpected = 0;
    let totalCovered = 0;

    for (const mep of model) {
        if (!mep.queryParams || mep.queryParams.length === 0) continue;
        const match = design.endpoints.find(uep => pathMatches(uep.path, mep.path) && uep.method === mep.method);
        if (match) {
            for (const param of mep.queryParams) {
                totalExpected++;
                if (match.queryParams.some(p => p.toLowerCase() === param.toLowerCase())) totalCovered++;
                else feedback.push(`${mep.method} ${mep.path}: missing query param '${param}'`);
            }
        }
    }

    if (feedback.length > 3) {
        const extra = feedback.length - 3;
        feedback.splice(3, extra, `...and ${extra} more missing query parameters`);
    }

    const ratio = totalExpected > 0 ? totalCovered / totalExpected : 0;
    const earned = Math.round(ratio * maxPoints);

    return { category: 'Query Parameters', maxPoints, earnedPoints: earned, feedback };
}

function scoreGeneric(maxPoints: number, category: string, criteria: string[], _challenge: InterviewChallenge, design: UserDesign): CategoryScore {
    // Heuristic: give partial credit based on endpoint count and complexity
    const endpointCount = design.endpoints.length;
    const ratio = Math.min(endpointCount / 4, 1); // up to 4 endpoints for full credit
    const earned = Math.round(ratio * maxPoints);
    const feedback = criteria.length > 0 ? [`Review: ${criteria[0]}`] : ['No specific feedback available'];

    return { category, maxPoints, earnedPoints: earned, feedback };
}

// ─── Helpers ────────────────────────────────────────────────

function pathMatches(userPath: string, modelPath: string): boolean {
    // Normalize and compare paths — handle :id vs {id} vs :param variations
    const normalize = (p: string) =>
        p.toLowerCase()
            .replace(/\/{2,}/g, '/')
            .replace(/\/$/g, '')
            .replace(/:[a-z_]+/gi, ':param')
            .replace(/\{[a-z_]+\}/gi, ':param');
    return normalize(userPath) === normalize(modelPath);
}

function fuzzyMatch(userText: string, modelText: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const u = normalize(userText);
    const m = normalize(modelText);

    // Exact match
    if (u === m) return true;

    // Check if key words overlap (at least 60%)
    const uWords = new Set(u.split(/\s+/));
    const mWords = m.split(/\s+/);
    const matched = mWords.filter(w => uWords.has(w)).length;
    return matched / Math.max(mWords.length, 1) >= 0.5;
}
