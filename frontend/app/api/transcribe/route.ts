import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
// @ts-ignore - types are not complete for fluent-ffmpeg
import ffmpeg from "fluent-ffmpeg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "@/config/aiConfig";
import { google } from 'googleapis';

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Avoid static import so Next.js doesn't inline ffmpeg into vendor-chunks
let ffmpegStaticPath: string = '' as any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ffmpegStaticPath = require('ffmpeg-static');
} catch {}

const getFfmpegPath = () => {
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim()) {
    return process.env.FFMPEG_PATH.trim();
  }
  if (ffmpegStaticPath && typeof ffmpegStaticPath === 'string') {
    return ffmpegStaticPath as string;
  }
  if (process.platform === 'win32') {
    return 'C://ffmpeg//bin//ffmpeg.exe';
  }
  return 'ffmpeg';
};

const getFfprobePath = () => {
  if (process.env.FFPROBE_PATH && process.env.FFPROBE_PATH.trim()) {
    return process.env.FFPROBE_PATH.trim();
  }
  if (process.platform === 'win32') {
    return 'C://ffmpeg//bin//ffprobe.exe';
  }
  return 'ffprobe';
};

export async function POST(req: Request) {
  try {
    console.log('Starting /api/transcribe');
    console.log('Content-Type:', req.headers.get('content-type'));
    console.log('Content-Length:', req.headers.get('content-length'));

    // Accept both multipart/form-data and JSON payloads
    // JSON shape supported: { base64: string, mimeType?: string, fileName?: string, scriptLanguage?: string } OR { url: string, scriptLanguage?: string }
    let incomingFile: File | null = null;
    let incomingBuffer: Buffer | null = null;
    let incomingFileName = `input-${Date.now()}.mp4`;
    let scriptLanguage = 'en'; // Default to English

    const contentType = req.headers.get('content-type') || '';
    console.log('Processing content-type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      try {
        console.log('Attempting to parse FormData...');
        const formData = await req.formData();
        console.log('FormData parsed successfully');
        const file = formData.get('file') as File | null;
        console.log('File found:', file?.name, 'Size:', file?.size);
        if (file) {
          incomingFile = file;
          incomingFileName = (file as any).name || incomingFileName;
          incomingBuffer = Buffer.from(await file.arrayBuffer());
          console.log('File buffer created, size:', incomingBuffer.length);
        }
        
        // Extract scriptLanguage from FormData
        const languageField = formData.get('scriptLanguage') as string | null;
        if (languageField) {
          scriptLanguage = languageField;
          console.log('Script language from FormData:', scriptLanguage);
        }
      } catch (e) {
        console.log('FormData parsing failed:', e);
        // Fallthrough to JSON parsing
      }
    }

    if (!incomingBuffer) {
      try {
        console.log('Attempting to parse JSON...');
        const json = await req.json();
        console.log('JSON parsed:', Object.keys(json));
        if (json?.base64) {
          const b64 = String(json.base64).replace(/^data:[^;]+;base64,/, '');
          incomingBuffer = Buffer.from(b64, 'base64');
          incomingFileName = json.fileName || incomingFileName;
          scriptLanguage = json.scriptLanguage || scriptLanguage;
          console.log('Base64 buffer created, size:', incomingBuffer.length);
          console.log('Script language from JSON:', scriptLanguage);
        } else if (json?.url) {
          const url = String(json.url);
          scriptLanguage = json.scriptLanguage || scriptLanguage;
          console.log('Downloading from URL:', url);
          console.log('Script language from JSON URL:', scriptLanguage);
          
          // Handle Google Drive URLs - use Drive API for authenticated download
          if (url.includes('drive.google.com')) {
            const fileIdMatch = url.match(/[?&]id=([^&]+)/);
            if (fileIdMatch) {
              const fileId = fileIdMatch[1];
              console.log('Using Google Drive API for file ID:', fileId);
              
              // Set up Google Drive API client
              const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
              const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
              const jwtClient = new google.auth.JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
              });
              const drive = google.drive({ version: 'v3', auth: jwtClient });
              
              // Download file using Drive API
              const response = await drive.files.get({
                fileId: fileId,
                alt: 'media'
              }, { responseType: 'arraybuffer' });
              
              incomingBuffer = Buffer.from(response.data as ArrayBuffer);
              incomingFileName = json.fileName || incomingFileName;
              console.log('Downloaded via Drive API, size:', incomingBuffer.length);
            } else {
              throw new Error('Invalid Google Drive URL format');
            }
          } else {
            // Regular URL download
            const res = await fetch(url);
            if (!res.ok) {
              throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
            }
            const blob = await res.blob();
            incomingBuffer = Buffer.from(await blob.arrayBuffer());
            incomingFileName = json.fileName || incomingFileName;
            console.log('Downloaded buffer created, size:', incomingBuffer.length);
          }
        }
      } catch (e) {
        console.log('JSON parsing failed:', e);
        // if both formData and JSON fail, we'll handle below
      }
    }

    if (!incomingBuffer) {
      console.log('No buffer created - returning error');
      return NextResponse.json({ error: 'No file provided (expecting multipart field "file", or JSON { base64 } / { url })' }, { status: 400 });
    }

    // Save video temporarily
    const buffer = incomingBuffer;
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const inputPath = path.join(uploadsDir, incomingFileName);
    const outputPath = path.join(uploadsDir, "output_audio.wav");
    fs.writeFileSync(inputPath, buffer);

    // Extract audio using FFmpeg (library API with explicit binary path)
    const ffmpegBin = getFfmpegPath();
    const ffprobeBin = getFfprobePath();
    try {
      (ffmpeg as any).setFfmpegPath(ffmpegBin);
      (ffmpeg as any).setFfprobePath(ffprobeBin);
    } catch {}

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .audioFrequency(44100)
        .audioChannels(2)
        .format('wav')
        .on('end', () => resolve())
        .on('error', (err: any) => {
          console.error('FFmpeg error (transcribe):', err);
          reject(err);
        })
        .save(outputPath);
    });

    // Read audio file
    const audioBytes = fs.readFileSync(outputPath).toString("base64");

    // Send to Gemini model for transcription
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL });

    // Create language-specific transcription prompt
    const languagePrompts: Record<string, string> = {
      'en': 'Transcribe this audio to English text. Provide accurate transcription with proper punctuation and capitalization.',
      'ur': 'Transcribe this audio to Urdu text. Provide accurate transcription in Urdu script with proper punctuation.',
      'ar': 'Transcribe this audio to Arabic text. Provide accurate transcription in Arabic script with proper punctuation.',
      'hi': 'Transcribe this audio to Hindi text. Provide accurate transcription in Devanagari script with proper punctuation.',
      'es': 'Transcribe this audio to Spanish text. Provide accurate transcription with proper punctuation and capitalization.',
      'fr': 'Transcribe this audio to French text. Provide accurate transcription with proper punctuation and capitalization.',
      'de': 'Transcribe this audio to German text. Provide accurate transcription with proper punctuation and capitalization.',
      'zh': 'Transcribe this audio to Chinese text. Provide accurate transcription in Chinese characters.',
      'ja': 'Transcribe this audio to Japanese text. Provide accurate transcription in Japanese characters.',
      'ko': 'Transcribe this audio to Korean text. Provide accurate transcription in Korean characters.',
    };

    const transcriptionPrompt = languagePrompts[scriptLanguage] || languagePrompts['en'];
    console.log('Using transcription prompt for language:', scriptLanguage);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/wav",
          data: audioBytes,
        },
      },
      {
        text: transcriptionPrompt,
      },
    ]);

    const text = result.response.text();

    // Cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    return NextResponse.json({ 
      text, 
      language: scriptLanguage,
      fileName: incomingFileName 
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
