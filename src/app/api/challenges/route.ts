import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dir = path.join(process.cwd(), 'public', 'challenges');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();

    const challenges = files.map(file => {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        return JSON.parse(content);
    });

    return NextResponse.json(challenges);
}
