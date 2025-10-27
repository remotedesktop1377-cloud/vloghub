import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
// @ts-ignore - types are not complete for fluent-ffmpeg
import ffmpeg from "fluent-ffmpeg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "@/config/aiConfig";
import { getDriveClient } from "@/services/googleDriveService";
import {
  generateJobId,
  createProgress,
  updateProgress,
  completeProgress,
  errorProgress,
  deleteProgress,
  calculateProgress,
  type ProgressStage
} from "@/utils/progressTracker";
import { getSupabase } from "@/utils/supabase";

// Avoid static import so Next.js doesn't inline ffmpeg into vendor-chunks
let ffmpegStaticPath: string = '' as any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ffmpegStaticPath = require('ffmpeg-static');
} catch { }

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

// Helper function to format time range
const formatTimeRange = (startTime: number, endTime: number): string => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Semantic segmentation using LLM
const performSemanticSegmentation = async (genAI: GoogleGenerativeAI, transcription: string, language: string) => {
  // Check if Gemini API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL_PRO });

  // Check if transcription is too short for semantic segmentation
  const wordCount = transcription.trim().split(/\s+/).length;
  if (wordCount < 50) {
    console.log('Transcription too short for semantic segmentation:', wordCount, 'words');
    return [];
  }

  const segmentationPrompt = `You are an expert at semantic segmentation of transcribed speech. 
Analyze the following ${language} transcription and break it into meaningful scenes based on topic shifts, thematic changes, and natural speech boundaries.

For each scene, provide:
1. A concise title (2-6 words)
2. A brief summary (1-2 sentences)
3. The exact text content
4. Extracts EXACT words and phrases from the text content that are most useful for visual search

Return ONLY valid JSON in this exact format:
{
  "scenes": [
    {
      "title": "Scene Title",
      "summary": "Brief summary of this scene",
      "text": "Exact text content for this scene"
      "highlightedKeywords": ["exact word", "exact phrase"]
    }
  ]
}

Guidelines:
- Create 3-8 scenes depending on content length
- Each scene should be 30-200 words
- Break at natural topic transitions
- Preserve the original language and meaning
- Ensure scenes flow logically
- For shorter content, create fewer but meaningful scenes

Transcription:
${transcription}`;

  try {
    console.log('Calling Gemini for semantic segmentation...');
    const result = await model.generateContent(segmentationPrompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];

    if (scenes.length === 0) {
      console.error('No scenes found in parsed response:', parsed);
      throw new Error('No scenes found in response');
    }

    // console.log('Semantic segmentation successful:', scenes.length, 'scenes');
    return scenes;
  } catch (error) {
    console.error('Semantic segmentation error:', error);
    throw error;
  }
};

// Helper function to process transcription into scenes using semantic segmentation
const processTranscriptionIntoScenes = async (genAI: GoogleGenerativeAI, transcription: string, language: string, jobId?: string) => {
  const wordCount = transcription.trim().split(/\s+/).length;
  console.log(`Starting scene segmentation for ${wordCount} words, language: ${language}`);

  // First, try semantic segmentation
  try {
    const semanticScenes = await performSemanticSegmentation(genAI, transcription, language);
    if (semanticScenes && semanticScenes.length > 0) {
      console.log('✅ Semantic segmentation successful:', semanticScenes.length, 'scenes');
      // Convert semantic scenes to our format with timing
      return calculateSequentialTimeRanges(semanticScenes.map((scene: any) => scene.text));
    } else {
      console.log('⚠️ Semantic segmentation returned 0 scenes, using fallback');
    }
  } catch (error) {
    console.error('❌ Semantic segmentation failed:', error instanceof Error ? error.message : error);
    console.log('→ Falling back to heuristic segmentation');
    // Check if it's a network error
    if (error instanceof Error && error.message.includes('fetch failed')) {
      console.log('🔗 Network error detected');
    }
  }

  // Fallback to heuristic segmentation
  console.log('Using heuristic segmentation as fallback');
  let scriptParagraphs: string[] = [];

  // Different splitting logic based on language
  if (language === 'ur' || language === 'ar' || language === 'hi') {
    // For RTL languages, split by single newlines
    scriptParagraphs = transcription
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  } else {
    // For LTR languages, split by double newlines or single newlines
    scriptParagraphs = transcription
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  // If no paragraphs found, try sentence-level splitting as intelligent fallback
  if (scriptParagraphs.length === 0 || (scriptParagraphs.length === 1 && scriptParagraphs[0].split(/\s+/).length > 30)) {
    console.log('No paragraph breaks found, using sentence-level splitting');
    const paragraphText = scriptParagraphs[0] || transcription;
    const wordCount = paragraphText.split(/\s+/).length;
    
    // Split by sentence boundaries (. ! ?)
    let sentences = paragraphText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // If no sentence endings found, split by commas or create segments by word count
    if (sentences.length === 1 && wordCount > 50) {
      console.log('No sentence endings found, splitting by word count');
      // Create scenes with ~30-40 words each
      const wordsPerScene = 35;
      const words = paragraphText.split(/\s+/);
      sentences = [];
      
      for (let i = 0; i < words.length; i += wordsPerScene) {
        const segment = words.slice(i, i + wordsPerScene).join(' ');
        if (segment.trim()) {
          sentences.push(segment);
        }
      }
    }

    // Group sentences into logical scenes (3-5 sentences per scene)
    const sentencesPerScene = Math.min(3, Math.ceil(sentences.length / 3)); // Aim for ~3 scenes
    for (let i = 0; i < sentences.length; i += sentencesPerScene) {
      const sceneText = sentences.slice(i, i + sentencesPerScene).join(' ');
      if (sceneText.trim()) {
        scriptParagraphs.push(sceneText);
      }
    }
  }

  // If still no paragraphs found, treat entire text as one scene
  if (scriptParagraphs.length === 0) {
    console.log('Treating entire transcription as single scene');
    scriptParagraphs = [transcription.trim()];
  }

  console.log(`Heuristic segmentation created ${scriptParagraphs.length} scenes`);
  // Calculate timing for each scene
  return calculateSequentialTimeRanges(scriptParagraphs);
};

// Calculate sequential time ranges for scenes
const calculateSequentialTimeRanges = (scriptParagraphs: string[]) => {
  if (scriptParagraphs.length === 0) return [];

  // Estimate total duration based on word count (average speaking rate: 150 words per minute)
  const totalWords = scriptParagraphs.reduce((sum, paragraph) => {
    return sum + paragraph.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, 0);

  const estimatedDurationSeconds = Math.max(60, Math.round((totalWords / 150) * 60)); // At least 1 minute
  console.log(`Estimated total duration: ${estimatedDurationSeconds} seconds for ${totalWords} words`);

  let currentTime = 0; // Start from 0 seconds

  return scriptParagraphs.map((paragraph, index) => {
    const words = paragraph.trim().split(/\s+/).filter(word => word.length > 0).length;

    // Calculate proportional duration based on word count
    const durationInSeconds = totalWords > 0
      ? Math.round((words / totalWords) * estimatedDurationSeconds)
      : Math.round(estimatedDurationSeconds / scriptParagraphs.length);

    const startTime = currentTime;
    const endTime = currentTime + durationInSeconds;

    // Update current time for next paragraph
    currentTime = endTime;

    return {
      id: `scene-${index + 1}`,
      narration: paragraph,
      duration: formatTimeRange(startTime, endTime),
      words,
      startTime,
      endTime,
      durationInSeconds,
      highlightedKeywords: [],
    };
  });
};

export async function POST(req: Request) {

  try {
    console.log('Starting /api/transcribe');
    console.log('Content-Type:', req.headers.get('content-type'));
    console.log('Content-Length:', req.headers.get('content-length'));

    let incomingBuffer: Buffer | null = null;
    let incomingFileName = `input-${Date.now()}.mp4`;
    let scriptLanguage = 'en'; // Default to English
    let driveUrl = '';
    let jobId = '';
    let userId = '';
    let file: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    console.log('Processing content-type:', contentType);

    if (contentType.includes('multipart/form-data')) {
      try {
        console.log('Attempting to parse FormData...');
        const formData = await req.formData();
        console.log('FormData parsed successfully');
        // Extract userId from FormData
        const userIdField = formData.get('userId') as string | null;
        if (userIdField) {
          userId = userIdField;
          console.log('User ID from FormData:', userId);
        }
        // Extract scriptLanguage from FormData
        const languageField = formData.get('scriptLanguage') as string | null;
        if (languageField) {
          scriptLanguage = languageField;
          console.log('Script language from FormData:', scriptLanguage);
        }
        // Extract driveUrl from FormData
        const driveUrlField = formData.get('driveUrl') as string | null;
        if (driveUrlField) {
          driveUrl = driveUrlField;
          console.log('Drive URL from FormData:', driveUrl);
        }
        // Extract jobId from FormData
        const job_Id = formData.get('jobId') as string | null;
        if (job_Id) {
          jobId = job_Id;
          console.log('Job ID from FormData:', jobId);
        }

        // Extract file from FormData
        const fileField = formData.get('file') as File | null;
        if (fileField && fileField !== null) {
          file = fileField;
          console.log('File from FormData:', file?.name);
        }
      } catch (e) {
        console.log('FormData parsing failed:', e);
        // Fallthrough to JSON parsing
      }
    }

    // Initialize progress tracking
    createProgress(jobId);
    updateProgress(jobId, 'initializing', 0, 'Starting transcription process...');

    if (!incomingBuffer) {
      try {
        console.log('Attempting to parse JSON...');
        const json = await req.json();
        console.log('JSON parsed:', Object.keys(json));

        if (json?.driveUrl) {
          const url = String(json.driveUrl);
          scriptLanguage = json.scriptLanguage || scriptLanguage;
          console.log('Downloading from URL:', url);

          // Handle Google Drive URLs - use Drive API for authenticated download
          if (url.includes('drive.google.com')) {
            const fileIdMatch = url.match(/[?&]id=([^&]+)/);
            if (fileIdMatch) {
              const fileId = fileIdMatch[1];
              console.log('Using Google Drive API for file ID:', fileId);

              // Set up Google Drive API client
              const drive = getDriveClient();

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
      errorProgress(jobId, 'No file provided');
      return NextResponse.json({ error: 'No file provided (expecting multipart field "file", or JSON { base64 } / { url })', jobId }, { status: 400 });
    }

    updateProgress(jobId, 'audio_extraction', 5, 'Preparing video file...');

    // Save video temporarily
    const buffer = incomingBuffer;
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const inputPath = path.join(uploadsDir, incomingFileName);
    const outputPath = path.join(uploadsDir, "output_audio.mp3");
    fs.writeFileSync(inputPath, buffer);

    // Check file size before processing
    const fileSizeInMB = buffer.length / (1024 * 1024);
    console.log(`Processing file: ${incomingFileName}, Size: ${fileSizeInMB.toFixed(2)} MB`);

    // Warn if file is very large
    if (fileSizeInMB > 100) {
      console.warn(`Large file detected: ${fileSizeInMB.toFixed(2)} MB. This may take longer to process.`);
    }

    // Extract audio using FFmpeg (library API with explicit binary path)
    const ffmpegBin = getFfmpegPath();
    const ffprobeBin = getFfprobePath();
    try {
      (ffmpeg as any).setFfmpegPath(ffmpegBin);
      (ffmpeg as any).setFfprobePath(ffprobeBin);
    } catch { }

    // Extract audio using FFmpeg - use compressed format for efficiency
    console.log(`Extracting audio from ${fileSizeInMB.toFixed(2)} MB video file`);
    const audioQuality = fileSizeInMB > 100 ? 'low' : 'high';

    updateProgress(jobId, 'audio_extraction', 10, `Extracting audio from ${fileSizeInMB.toFixed(2)} MB video...`);

    await new Promise<void>((resolve, reject) => {
      let progressUpdated = false;
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('libmp3lame') // Use MP3 compression instead of uncompressed PCM
        .audioFrequency(audioQuality === 'low' ? 16000 : 22050) // Lower sample rates for speech
        .audioChannels(1) // Always use mono for speech transcription
        .audioBitrate(audioQuality === 'low' ? '64k' : '128k') // Compressed bitrate
        .format('mp3') // Use MP3 format for compression
        .on('start', (commandLine) => {
          console.log('FFmpeg started:', commandLine);
          updateProgress(jobId, 'audio_extraction', 15, 'Processing video...');
        })
        .on('progress', (progress) => {
          if (!progressUpdated && progress.timemark) {
            updateProgress(jobId, 'audio_extraction', 50, `Extracting audio: ${progress.timemark}`);
            progressUpdated = true;
          }
        })
        .on('end', () => {
          console.log('Audio extraction completed');
          updateProgress(jobId, 'audio_extraction', 100, 'Audio extraction completed');
          resolve();
        })
        .on('error', (err: any) => {
          console.error('FFmpeg error (transcribe):', err);
          errorProgress(jobId, `Audio extraction failed: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });

    // Read audio file and check size
    let audioBuffer = fs.readFileSync(outputPath);
    let audioSizeInMB = audioBuffer.length / (1024 * 1024);
    console.log(`Initial extracted audio size: ${audioSizeInMB.toFixed(2)} MB`);

    // Additional compression if still too large (rare case with MP3)
    const maxAudioSizeMB = 500; // Target size for Gemini API
    const compressedOutputPath = path.join(uploadsDir, "compressed_audio.mp3");
    let compressionUsed = false;

    updateProgress(jobId, 'audio_compression', 0, `Checking audio size: ${audioSizeInMB.toFixed(2)} MB...`);

    if (audioSizeInMB > maxAudioSizeMB) {
      console.log(`Audio file still too large (${audioSizeInMB.toFixed(2)} MB), applying additional compression...`);
      updateProgress(jobId, 'audio_compression', 10, `Compressing audio file to reduce size...`);

      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(outputPath)
            .audioCodec('libmp3lame')
            .audioFrequency(16000) // Very low sample rate for compression
            .audioChannels(1) // Mono
            .audioBitrate('32k') // Very low bitrate for extreme compression
            .format('mp3')
            .on('start', () => {
              updateProgress(jobId, 'audio_compression', 30, 'Compressing audio...');
            })
            .on('end', () => {
              console.log('Additional audio compression completed');
              updateProgress(jobId, 'audio_compression', 80, 'Compression completed');
              resolve();
            })
            .on('error', (err: any) => {
              console.error('Additional audio compression error:', err);
              errorProgress(jobId, `Audio compression failed: ${err.message}`);
              reject(err);
            })
            .save(compressedOutputPath);
        });

        // Check compressed file size
        const compressedBuffer = fs.readFileSync(compressedOutputPath);
        const compressedSizeInMB = compressedBuffer.length / (1024 * 1024);
        console.log(`Additional compressed audio size: ${compressedSizeInMB.toFixed(2)} MB`);

        // Use compressed file if it's smaller
        if (compressedSizeInMB < audioSizeInMB) {
          audioBuffer = compressedBuffer;
          audioSizeInMB = compressedSizeInMB;
          compressionUsed = true;
          console.log(`Using additional compressed audio (${audioSizeInMB.toFixed(2)} MB)`);

          // Clean up original file
          fs.unlinkSync(outputPath);
        } else {
          console.log('Additional compression did not reduce size significantly, using original');
          fs.unlinkSync(compressedOutputPath);
        }
      } catch (compressionError) {
        console.error('Additional compression failed, using original file:', compressionError);
        // Clean up compressed file if it exists
        if (fs.existsSync(compressedOutputPath)) {
          fs.unlinkSync(compressedOutputPath);
        }
      }
    }

    // Final size check
    if (audioSizeInMB > maxAudioSizeMB) {
      console.error(`Audio file still too large after compression: ${audioSizeInMB.toFixed(2)} MB (max: ${maxAudioSizeMB} MB)`);
      // Cleanup
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(compressedOutputPath)) fs.unlinkSync(compressedOutputPath);
      return NextResponse.json({
        error: `Audio file is too large (${audioSizeInMB.toFixed(2)} MB) even after compression. Please use a shorter video. Maximum supported size is ${maxAudioSizeMB} MB.`
      }, { status: 413 });
    }

    updateProgress(jobId, 'bytes_conversion', 10, 'Converting audio to base64...');
    const audioBytes = audioBuffer.toString("base64");
    updateProgress(jobId, 'bytes_conversion', 100, 'Conversion completed');

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

    try {
      // Send to Gemini model for transcription
      updateProgress(jobId, 'generateContent', 10, 'Initializing Gemini AI...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

      const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL_PRO });
      console.log('Using Gemini model:', model.model);

      updateProgress(jobId, 'generateContent', 30, 'Sending audio to Gemini for transcription...');
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: audioBytes,
          },
        },
        {
          text: transcriptionPrompt,
        },
      ]);

      updateProgress(jobId, 'generateContent', 80, 'Received transcription...');
      const text = result.response.text();
      updateProgress(jobId, 'generateContent', 100, 'Transcription completed');

      // Process transcription into scenes using semantic segmentation
      console.log('Processing transcription into scenes...');
      updateProgress(jobId, 'semantic_segmentation', 10, 'Processing transcription into scenes...');
      const scenes = await processTranscriptionIntoScenes(genAI, text, scriptLanguage, jobId);
      console.log('Scenes processed:', scenes.length);
      updateProgress(jobId, 'semantic_segmentation', 100, `Successfully created ${scenes.length} scenes`);

      // Cleanup
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(compressedOutputPath)) fs.unlinkSync(compressedOutputPath);

      // Mark as completed
      completeProgress(jobId);

      // Save job result to Supabase if userId exists
      if (userId) {
        try {
          const supabase = getSupabase();
          await supabase.from('transcription_jobs').upsert({
            job_id: jobId,
            user_id: userId,
            job_name: incomingFileName.replace(/\.[^/.]+$/, ''), // Remove extension
            drive_url: driveUrl,
            file_name: incomingFileName,
            script_language: scriptLanguage,
            status: 'completed',
            stage: 'completed',
            progress: 100,
            message: 'Transcription completed successfully',
            transcription_data: {
              text,
              language: scriptLanguage,
              audioSizeMB: audioSizeInMB.toFixed(2),
              compressed: compressionUsed,
              scenes
            }
          } as any, {
            onConflict: 'job_id'
          });
        } catch (error) {
          console.error('Error saving transcription job to Supabase:', error);
          // Don't fail the request if Supabase save fails
        }
      }

      // Return response with jobId for tracking
      const response = NextResponse.json({
        text,
        language: scriptLanguage,
        fileName: incomingFileName,
        audioSizeMB: audioSizeInMB.toFixed(2),
        compressed: compressionUsed,
        scenes: scenes,
        jobId
      });

      // Clean up progress after 1 minute
      deleteProgress(jobId);

      return response;
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);

      // Cleanup on error
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(compressedOutputPath)) fs.unlinkSync(compressedOutputPath);

      // Update progress with error
      let errorMessage = `Transcription failed: ${geminiError.message || 'Unknown error'}`;

      // Save error to Supabase if userId exists
      if (userId) {
        try {
          const supabase = getSupabase();
          await supabase.from('transcription_jobs').upsert({
            job_id: jobId,
            user_id: userId,
            job_name: incomingFileName.replace(/\.[^/.]+$/, ''),
            drive_url: driveUrl,
            file_name: incomingFileName,
            script_language: scriptLanguage,
            status: 'failed',
            stage: 'error',
            progress: 0,
            message: errorMessage,
            error: errorMessage
          } as any, {
            onConflict: 'job_id'
          });
        } catch (error) {
          console.error('Error saving transcription job error to Supabase:', error);
        }
      }

      // Provide more specific error messages
      if (geminiError.message?.includes('string longer than')) {
        errorMessage = 'Audio file is too large for processing. Please use a shorter video or compress it first.';
        errorProgress(jobId, errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 413 });
      }

      if (geminiError.message?.includes('fetch failed')) {
        errorMessage = 'Network error occurred during transcription. Please check your internet connection and try again.';
        errorProgress(jobId, errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 503 });
      }

      errorProgress(jobId, errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
