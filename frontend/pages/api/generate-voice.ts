import type { NextApiRequest, NextApiResponse } from 'next';

type Data = { audioUrl: string } | { error: string };

interface VoiceGenerationRequest {
  text: string;
  voiceStyle: string;
  voiceId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceStyle, voiceId = 'pNInz6obpgDQGcFmaJgB' }: VoiceGenerationRequest = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEYS;
    if (!apiKey) {
      console.warn('⚠️ ElevenLabs API key not configured, returning mock audio');
      // For testing: return a mock audio data URL
      const mockAudioBase64 = "UklGRjjrAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQTrAAAA"; // Very short silent audio
      return res.status(200).json({ audioUrl: `data:audio/wav;base64,${mockAudioBase64}` });
    }

    // Map voiceover style to ElevenLabs settings
    const getVoiceSettings = (style: string) => {
      const lowerStyle = style.toLowerCase();

      if (lowerStyle.includes('energetic') || lowerStyle.includes('excited')) {
        return { stability: 0.3, similarity_boost: 0.8, speed: 1.1 };
      } else if (lowerStyle.includes('calm') || lowerStyle.includes('soothing')) {
        return { stability: 0.8, similarity_boost: 0.6, speed: 0.9 };
      } else if (lowerStyle.includes('dramatic') || lowerStyle.includes('intense')) {
        return { stability: 0.4, similarity_boost: 0.9, speed: 0.95 };
      } else if (lowerStyle.includes('conversational') || lowerStyle.includes('friendly')) {
        return { stability: 0.5, similarity_boost: 0.7, speed: 1.0 };
      } else if (lowerStyle.includes('professional') || lowerStyle.includes('authoritative')) {
        return { stability: 0.7, similarity_boost: 0.8, speed: 0.95 };
      } else {
        // Default settings
        return { stability: 0.5, similarity_boost: 0.7, speed: 1.0 };
      }
    };

    const voiceSettings = getVoiceSettings(voiceStyle);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(500).json({ error: `ElevenLabs API error: ${response.status}` });
    }

    // Get the audio data as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64 for data URL
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    res.status(200).json({ audioUrl: audioDataUrl });
  } catch (error) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: 'Failed to generate voice' });
  }
}
