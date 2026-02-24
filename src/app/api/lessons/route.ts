import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const lessonsDir = path.join(process.cwd(), 'public', 'lessons');
        const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json')).sort();

        const lessons = files.map(file => {
            const content = fs.readFileSync(path.join(lessonsDir, file), 'utf-8');
            return JSON.parse(content);
        });

        return NextResponse.json(lessons);
    } catch (err) {
        console.error('Failed to load lessons:', err);
        return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 });
    }
}
