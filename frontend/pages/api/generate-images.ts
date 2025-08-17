import type { NextApiRequest, NextApiResponse } from 'next';
// Using direct HTTP call to Gemini image-generation endpoint

type Data = { images: string[] } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
            return;
        }

        const { visuals } = req.body as { visuals?: string };
        if (!visuals || !visuals.trim()) {
            res.status(400).json({ error: 'visuals is required' });
            return;
        }
// const genAI = new GoogleGenAI({apiKey});
        // const prompt = `You are an assistant that creates stock-like illustrative images for a video script.
        // Return 9 square thumbnails as base64 PNG data URLs only, in JSON array format.
        // Each image should be different and representative of the script sections. Avoid text overlay.
        // Script:\n${visuals}`;


 // const response = await genAI.models.generateImages({
        //   model: 'imagen-4.0-generate-preview-06-06',
        //   prompt,
        //   config: { numberOfImages: 4 },
        // });

  // const images: string[] = [];
        // if (Array.isArray((response as any)?.generatedImages)) {
        //   for (const generatedImage of (response as any).generatedImages) {
        //     const imgBytes: string | undefined = generatedImage?.image?.imageBytes;
        //     if (imgBytes && typeof imgBytes === 'string') {
        //       images.push(`data:image/png;base64,${imgBytes}`);
        //     }
        //   }
        // }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;

        // const prompt = `Create cinematic, stock-style thumbnails (1:1) based on these visual directions. Avoid text overlay. Provide multiple diverse options. Visuals:\n${visuals}`;
        const prompt = `Create cinematic, stock-style thumbnails (1:1) based on these visual directions. Avoid text overlay. Visuals:\n${visuals}`;

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['TEXT','IMAGE'] }
          })
        });

        if (!resp.ok) {
          const errText = await resp.text();
          console.error('Gemini image HTTP error:', resp.status, errText);
          return res.status(500).json({ error: `Gemini HTTP ${resp.status}` });
        }

        const json: any = await resp.json();
        const images: string[] = [];

        const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
        for (const cand of candidates) {
          const parts = (cand?.content?.parts || []).concat(cand?.content?.part || []);
          for (const part of parts) {
            // Try various shapes Gemini might return
            const inline = part?.inlineData || part?.inline_data;
            if (inline?.data) {
              const mime = inline?.mimeType || inline?.mime_type || 'image/png';
              images.push(`data:${mime};base64,${inline.data}`);
              continue;
            }
            if (part?.text && typeof part.text === 'string') {
              // Sometimes text may contain a data URL; try to extract
              const match = part.text.match(/data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+/);
              if (match) images.push(match[0]);
            }
          }
        }

        // Fallback: empty array if parsing fails
        res.status(200).json({ images });
    } catch (e: any) {
        console.error('generate-images error', e);
        res.status(500).json({ error: 'Failed to generate images' });
    }
}


