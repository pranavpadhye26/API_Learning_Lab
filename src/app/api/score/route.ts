import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { scoreDesign } from '@/lib/scoring-engine';
import type { InterviewChallenge, UserDesign } from '@/lib/interview-types';

export async function POST(request: Request) {
    try {
        const { challengeId, design } = await request.json() as { challengeId: string; design: UserDesign };

        // Load challenge
        const dir = path.join(process.cwd(), 'public', 'challenges');
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        let challenge: InterviewChallenge | null = null;

        for (const file of files) {
            const content = fs.readFileSync(path.join(dir, file), 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed.id === challengeId) {
                challenge = parsed;
                break;
            }
        }

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        const report = scoreDesign(challenge, design);
        return NextResponse.json(report);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to score design', detail: String(err) }, { status: 400 });
    }
}
