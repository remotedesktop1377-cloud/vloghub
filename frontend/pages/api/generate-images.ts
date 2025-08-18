import type { NextApiRequest, NextApiResponse } from 'next';

type Data = { imageUrl: string } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
            return;
        }

        const { prompt, width, height, seed } = req.body as { 
            prompt?: string; 
            width?: number; 
            height?: number; 
            seed?: number; 
        };
        if (!prompt || !prompt.trim()) {
            res.status(400).json({ error: 'prompt is required' });
            return;
        }
        // Generate image with Gemini
        const imageUrl = await generateWithGeminiImage(prompt, { width, height, seed });

        res.status(200).json({ imageUrl });
    } catch (e: any) {
        console.error('generate-images error', e);
        res.status(500).json({ error: e?.message ?? 'Generation failed' });
    }
}

// Swap this using your preferred client (Google AI Studio Images API / Vertex AI Imagen 3)
async function generateWithGeminiImage(prompt: string, opts?: { width?: number; height?: number; seed?: number }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
    
    // Enhanced prompt for better image generation
    const enhancedPrompt = `Create a cinematic, stock-style image based on this description. Avoid text overlay. Make it visually appealing and professional. Description: ${prompt}`;

    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: enhancedPrompt }] }],
            generationConfig: { 
                responseModalities: ['TEXT', 'IMAGE'],
                // Note: Gemini API doesn't directly support width/height/seed in this format
                // You would need to adapt based on your actual API client
            }
        })
    });

    if (!resp.ok) {
        const errText = await resp.text();
        console.error('Gemini image HTTP error:', resp.status, errText);
        throw new Error(`Gemini HTTP ${resp.status}: ${errText}`);
    }

    const json: any = await resp.json();
    
    // Extract image from response
    const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
    for (const cand of candidates) {
        const parts = (cand?.content?.parts || []).concat(cand?.content?.part || []);
        for (const part of parts) {
            // Try various shapes Gemini might return
            const inline = part?.inlineData || part?.inline_data;
            if (inline?.data) {
                const mime = inline?.mimeType || inline?.mime_type || 'image/png';
                // Return base64 data URL - in production, you should upload to storage and return URL
                return `data:${mime};base64,${inline.data}`;
            }
            if (part?.text && typeof part.text === 'string') {
                // Sometimes text may contain a data URL; try to extract
                const match = part.text.match(/data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+/);
                if (match) return match[0];
            }
        }
    }
    
    throw new Error('No image generated in response');
}


