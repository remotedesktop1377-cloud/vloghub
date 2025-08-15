import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '../../src/config/aiConfig';

type Data = { variations: string[] } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });
            return;
        }

        const { narration, visuals, topic, noOfNarrations = AI_CONFIG.CONTENT.MAX_TOPIC_SUGGESTIONS } = req.body as { narration?: string; visuals?: string; topic?: string; noOfNarrations?: number };
        if (!narration || !narration.trim()) {
            res.status(400).json({ error: 'narration is required' });
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: AI_CONFIG.GEMINI.MODEL,
          generationConfig: { 
            temperature: 1.05, 
            topP: 0.95, 
            topK: 64, 
            candidateCount: noOfNarrations, 
            responseMimeType: 'text/plain' 
          }
        });

        const prompt = `ROLE
You are a senior video scriptwriter rewriting short narration lines.

TASK
Produce ${noOfNarrations} distinct alternatives to the narration below.

OUTPUT FORMAT
Return ONLY a pure JSON array of strings (no markdown, no keys, no comments).

HARD RULES
- Preserve the original meaning, named entities, places, and facts; add nothing new.
- Each option must differ clearly in wording AND sentence structure (not just synonyms).
- Keep the same language as the input, and preserve tense and point of view.
- 1–2 sentences per option; aim for ~8–28 words; natural spoken tone.
- Vary style across options (e.g., informative, inspirational, cinematic, conversational, urgent).
- Keep any placeholders as-is (e.g., {name}, [SFX], (YEAR)).
- No quotes, numbering, bullets, hashtags, emojis, or explanations.
- Trim whitespace; no trailing spaces or blank lines.

NARRATION TO REWRITE
${narration}`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 1.05, topP: 0.95, topK: 64, candidateCount: noOfNarrations, responseMimeType: 'text/plain' },
        } as any);

        let variations: string[] = [];
        const candidates: any[] = (result as any)?.response?.candidates || [];
        for (const c of candidates) {
            const parts = (c?.content?.parts || []).filter((p: any) => typeof p?.text === 'string');
            if (parts.length) {
                const line = String(parts.map((p: any) => p.text).join(' ')).trim();
                if (line) variations.push(line);
            } else if (typeof c?.content?.text === 'string') {
                const line = c.content.text.trim();
                if (line) variations.push(line);
            }
        }

        // Post-process: dedupe, remove near-duplicates and exact matches against original
        const normalize = (s: string) => s.replace(/[\s\n]+/g, ' ').replace(/["'`]/g, '').trim().toLowerCase();
        const originalNorm = normalize(narration);
        const isTooSimilar = (a: string) => {
            const an = normalize(a);
            if (an === originalNorm) return true;
            const aWords = new Set(an.split(/[^a-z0-9]+/g).filter(Boolean));
            const oWords = new Set(originalNorm.split(/[^a-z0-9]+/g).filter(Boolean));
            let intersect = 0;
            aWords.forEach((w) => { if (oWords.has(w)) intersect++; });
            const jaccard = intersect / new Set([...Array.from(aWords), ...Array.from(oWords)]).size;
            return jaccard > 0.7; // treat as too similar
        };

        const unique: string[] = [];
        const seen = new Set<string>();
        for (const v of variations) {
            if (!v || typeof v !== 'string') continue;
            if (isTooSimilar(v)) continue;
            const n = normalize(v);
            if (seen.has(n)) continue;
            seen.add(n);
            unique.push(v.trim());
            if (unique.length >= noOfNarrations) break;
        }

        // Fallbacks if the model returned poor/duplicate results
        while (unique.length < noOfNarrations) {
            const base = narration.trim();
            const idx = unique.length;
            const alt = [
                `In this part, ${base.charAt(0).toLowerCase()}${base.slice(1)}`,
                `Let's break it down: ${base}`,
                `Simply put, ${base}`,
                `Here's the idea: ${base}`,
            ][idx % 4];
            if (!isTooSimilar(alt)) unique.push(alt);
            else unique.push(`${base} (rephrased)`);
        }

        res.status(200).json({ variations: unique.slice(0, noOfNarrations) });
    } catch (e) {
        console.error('get-narration-variations error', e);
        res.status(500).json({ error: 'Failed to generate narration variations' });
    }
}


