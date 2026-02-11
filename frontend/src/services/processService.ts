import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { SceneData } from '@/types/sceneData';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const processService = {
    audioFfmpeg: null as FFmpeg | null,

    async compressVideo(
        file: File,
        jobId: string,
        options?: { crf?: number; maxWidth?: number; preset?: string; outputFileName?: string }
    ): Promise<File> {
        const originalSizeMB = file.size / (1024 * 1024);
        // console.log(`Compression starting: ${(originalSizeMB || 0).toFixed(2)} MB`, { name: file.name, type: file.type });
        const ffmpeg = await processService.getAudioFfmpeg();
        const extFromName = file.name.split('.').pop();
        const extFromType = file.type.split('/')[1];
        const ext = extFromName || extFromType || 'mp4';
        const inputName = `uploaded_video_${jobId}.${ext}`;
        const outputName = `compressed_video_${jobId}.mp4`;
        const crf = Number.isFinite(options?.crf) ? options!.crf! : 28;
        const preset = options?.preset || 'veryfast';
        const maxWidth = Number.isFinite(options?.maxWidth) ? options!.maxWidth! : 1280;

        await ffmpeg.writeFile(inputName, await fetchFile(file));
        const scaleFilter = `scale='min(${maxWidth},iw)':-2`;
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', scaleFilter,
            '-c:v', 'libx264',
            '-preset', preset,
            '-crf', String(crf),
            '-c:a', 'aac',
            '-b:a', '128k',
            outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data as any], { type: 'video/mp4' });
        const compressedFile = new File([blob], outputName, { type: 'video/mp4' });
        // const compressedSizeMB = compressedFile.size / (1024 * 1024);
        // const compressionRatio = file.size > 0 ? ((1 - compressedFile.size / file.size) * 100) : 0;
        // console.log(`Compression completed: ${(compressedSizeMB || 0).toFixed(2)} MB`, {
        //     name: compressedFile.name,
        //     type: compressedFile.type,
        //     reductionPercent: Number(compressionRatio.toFixed(1))
        // });
        return compressedFile;
    },

    async getAudioFfmpeg(): Promise<FFmpeg> {
        if (processService.audioFfmpeg) return processService.audioFfmpeg;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        processService.audioFfmpeg = ffmpeg;
        return ffmpeg;
    },

    async extractAudioFromVideo(file: File, outputFileName?: string): Promise<File> {
        const ffmpeg = await processService.getAudioFfmpeg();
        const extFromName = file.name.split('.').pop();
        const extFromType = file.type.split('/')[1];
        const ext = extFromName || extFromType || 'mp4';
        const inputName = `input-${Date.now()}.${ext}`;
        const outputName = outputFileName || `audio-${Date.now()}.mp3`;

        await ffmpeg.writeFile(inputName, await fetchFile(file));
        await ffmpeg.exec([
            '-i', inputName,
            '-vn',
            '-acodec', 'libmp3lame',
            '-b:a', '64k',
            '-ar', '22050',
            outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data as any], { type: 'audio/mpeg' });
        return new File([blob], outputName, { type: 'audio/mpeg' });
    },

    async transcribeAudio(audioFile: File): Promise<string> {
        const formData = new FormData();
        formData.append('audio', audioFile);
        const response = await fetch(API_ENDPOINTS.API_TRANSCRIBE_AUDIO, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Audio transcription failed');
        }
        const data = await response.json();
        return data?.text || '';
    },

    async planScenesWithLLM(payload: { transcription: string; videoDurationSeconds: number }) {
        const response = await fetch(API_ENDPOINTS.PLAN_SCENES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Scene planning failed');
        }
        const data = await response.json();
        return data?.scenes || [];
    },

    async cutClipsAndPackageResults(payload: { videoFile: File; scenes: SceneData[]; jobId: string }) {
        const formData = new FormData();
        formData.append('file', payload.videoFile);
        formData.append('scenes', JSON.stringify(payload.scenes || []));
        formData.append('jobId', payload.jobId);
        const response = await fetch(API_ENDPOINTS.CUT_CLIPS, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Clip cutting failed');
        }
        return response.json();
    },
};
