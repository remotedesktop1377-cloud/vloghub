import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        if (!audioFile) {
            return NextResponse.json({ error: 'audio is required' }, { status: 400 });
        }

        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
            model: AI_CONFIG.GEMINI.MODEL_FLASH,
            generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
        });

        const prompt = `Please transcribe this audio file completely.
Include all repeated words and sentences exactly as spoken, including duplicates.
Return only the transcription text, nothing else.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: audioFile.type || 'audio/mpeg'
                }
            }
        ]);

        let text = result.response.text().trim();
        if (text.includes('```')) {
            text = text.split('\n').filter(line => !line.trim().startsWith('```')).join('\n').trim();
        }

        return NextResponse.json({ text });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Audio transcription failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
