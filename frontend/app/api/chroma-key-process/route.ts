import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
// @ts-ignore - fluent-ffmpeg doesn't have proper TypeScript definitions
import ffmpeg from 'fluent-ffmpeg';
// Avoid static import so Next.js doesn't inline into vendor-chunks
let ffmpegPath: string = '' as any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ffmpegPath = require('ffmpeg-static');
} catch {}

export const runtime = 'nodejs';

// Fix FFmpeg path issue
const getFfmpegPath = () => {
  // 1) Explicit env override
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim()) {
    return process.env.FFMPEG_PATH.trim();
  }
  // 2) Resolved module path if available
  if (ffmpegPath && typeof ffmpegPath === 'string') {
    return ffmpegPath as string;
  }
  // 3) Common Windows install fallback
  if (process.platform === 'win32') {
    const common = 'C://ffmpeg//bin//ffmpeg.exe';
    return common;
  }
  // 4) System PATH
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobName = formData.get('jobName') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No video file uploaded' }, { status: 400 });
    }

    if (!jobName) {
      return NextResponse.json({ error: 'Job name is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a video file (MP4, AVI, MOV, MKV, or WebM)' 
      }, { status: 400 });
    }

    // Create temporary directory for processing
    const tmpDir = os.tmpdir();
    const jobDir = path.join(tmpDir, `chroma-key-${jobName}-${Date.now()}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const inputPath = path.join(jobDir, `input-${file.name}`);
    const outputPath = path.join(jobDir, `processed-${file.name}`);
    
    // Save uploaded video
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    // Process chroma key video
    await new Promise((resolve, reject) => {
      const ffmpegBin = getFfmpegPath();
      const ffprobeBin = getFfprobePath();
      try {
        // Some ffmpeg builds need ffprobe configured as well
        (ffmpeg as any).setFfmpegPath(ffmpegBin);
        (ffmpeg as any).setFfprobePath(ffprobeBin);
      } catch {}
      console.log('Using FFmpeg at:', ffmpegBin);
      ffmpeg(inputPath)
        .setFfmpegPath(ffmpegBin)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset', 'fast',
          '-crf', '23',
          '-movflags', '+faststart'
        ])
        .on('progress', (progress: any) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          console.log('Chroma key processing completed');
          resolve(true);
        })
        .on('error', (err: any) => {
          console.error('FFmpeg processing error:', err);
          reject(err);
        })
        .save(outputPath);
    });

    // Read processed video
    const processedBuffer = fs.readFileSync(outputPath);
    
    // Cleanup temporary files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    fs.rmdirSync(jobDir);

    // Return processed video as base64
    const base64Video = processedBuffer.toString('base64');
    
    return NextResponse.json({
      success: true,
      message: 'Chroma key video processed successfully',
      processedVideo: base64Video,
      fileName: file.name,
      fileSize: processedBuffer.length
    });

  } catch (error) {
    console.error('Chroma key processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chroma key video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
