import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getDriveClient, getRootFolderId, findOrCreateFolder } from '@/services/googleDriveServer';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DEFAULT_FPS = 30;

const sanitizeName = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, '-');

const runProcess = (command: string, args: string[]) => {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args);
        let stderr = '';
        child.stderr.on('data', chunk => {
            stderr += chunk.toString();
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(stderr || `Command failed: ${command}`));
        });
    });
};

const runProcessCapture = (command: string, args: string[]) => {
    return new Promise<string>((resolve, reject) => {
        const child = spawn(command, args);
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', chunk => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', chunk => {
            stderr += chunk.toString();
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
                return;
            }
            reject(new Error(stderr || `Command failed: ${command}`));
        });
    });
};

const getVideoDuration = async (videoPath: string) => {
    try {
        const output = await runProcessCapture('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            videoPath
        ]);
        const parsed = Number(output);
        return Number.isFinite(parsed) ? parsed : 0;
    } catch {
        return 0;
    }
};

const formatTimeRange = (startTime: number, endTime: number) => {
    const formatPoint = (point: number) => {
        const safe = Math.max(0, point);
        const mins = Math.floor(safe / 60);
        const secs = Math.round(safe - mins * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatPoint(startTime)} - ${formatPoint(endTime)}`;
};

const createSceneFolders = async (jobId: string, count: number) => {
    const drive = getDriveClient();
    const rootId = getRootFolderId();
    const projectFolder = await findOrCreateFolder(drive, jobId, rootId);
    const width = count >= 100 ? 3 : count >= 10 ? 2 : 1;
    const folderIds: string[] = [];
    for (let i = 1; i <= count; i++) {
        const name = `scene-${String(i).padStart(width, '0')}`;
        const folder = await findOrCreateFolder(drive, name, projectFolder.id);
        folderIds.push(folder.id);
    }
    return { drive, folderIds };
};

const uploadClipToDrive = async (drive: any, folderId: string, filePath: string, fileName?: string) => {
    const buffer = await fs.readFile(filePath);
    const stream = Readable.from(buffer);
    const created = await drive.files.create({
        requestBody: {
            name: fileName || path.basename(filePath),
            parents: [folderId],
            mimeType: 'video/mp4'
        },
        media: { mimeType: 'video/mp4', body: stream },
        supportsAllDrives: true,
        fields: 'id'
    });
    const fileId = created.data.id;
    if (!fileId) return null;
    await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true
    });
    return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const scenesRaw = String(formData.get('scenes') || '[]');
        const jobId = String(formData.get('jobId') || '').trim();
        const fps = Number(formData.get('fps') || DEFAULT_FPS) > 0 ? Number(formData.get('fps') || DEFAULT_FPS) : DEFAULT_FPS;

        if (!file) {
            return NextResponse.json({ error: 'file is required' }, { status: 400 });
        }

        let scenes: Array<any> = [];
        try {
            scenes = JSON.parse(scenesRaw);
        } catch {
            scenes = [];
        }

        if (!Array.isArray(scenes) || scenes.length === 0) {
            return NextResponse.json({ error: 'scenes is required' }, { status: 400 });
        }

        const projectRoot = path.resolve(process.cwd(), '..');
        const exportsDir = path.join(projectRoot, 'exports');
        const tempDir = path.join(exportsDir, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const safeName = sanitizeName(file.name || `upload-${Date.now()}.mp4`);
        const videoPath = path.join(tempDir, `${jobId || 'job'}-${Date.now()}-${safeName}`);
        const videoBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(videoPath, videoBuffer);

        const actualDurationSeconds = await getVideoDuration(videoPath);
        const maxSceneEnd = scenes.reduce((maxValue, scene) => {
            const endTime = Number(scene?.endTime || 0);
            return endTime > maxValue ? endTime : maxValue;
        }, 0);
        if (actualDurationSeconds > 0 && maxSceneEnd > actualDurationSeconds) {
            const scaleFactor = actualDurationSeconds / maxSceneEnd;
            scenes = scenes.map((scene) => {
                const startTime = Number(scene?.startTime || 0) * scaleFactor;
                const endTime = Number(scene?.endTime || 0) * scaleFactor;
                const durationInSeconds = Math.max(0, endTime - startTime);
                const startFrame = Math.max(0, Math.floor(startTime * fps));
                const endFrame = Math.max(startFrame, Math.floor(endTime * fps));
                return {
                    ...scene,
                    startTime: Math.round(startTime * 100) / 100,
                    endTime: Math.round(endTime * 100) / 100,
                    durationInSeconds: Math.round(durationInSeconds * 100) / 100,
                    duration: formatTimeRange(startTime, endTime),
                    startFrame,
                    endFrame,
                    durationInFrames: Math.max(1, endFrame - startFrame)
                };
            });
        }

        let driveInfo: { drive: any; folderIds: string[] } | null = null;
        if (jobId && scenes.length > 0) {
            driveInfo = await createSceneFolders(jobId, scenes.length);
        }

        const segmentTranscriptions: Array<Record<string, any>> = [];

        let previousEndTime = 0;
        for (let i = 0; i < scenes.length; i++) {
            const edit = scenes[i];
            const originalStart = Number(edit.startTime || 0);
            const originalEnd = Number(edit.endTime || 0);
            const startTime = i === 0 ? Math.max(0, originalStart) : Math.max(previousEndTime, originalStart);
            let endTime = originalEnd > startTime ? originalEnd : startTime + (originalEnd - originalStart);
            if (startTime >= endTime) {
                continue;
            }

            const segmentFilename = `segment_${edit.id || `scene-${i + 1}`}.mp4`;
            const segmentPath = path.join(exportsDir, segmentFilename);
            await runProcess('ffmpeg', [
                '-y',
                '-ss', String(startTime),
                '-to', String(endTime),
                '-i', videoPath,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '28',
                '-c:a', 'aac',
                '-b:a', '128k',
                segmentPath
            ]);

            let previewClipUrl: string | null = null;
            if (driveInfo) {
                try {
                    const fileExtension = segmentFilename.split('.').pop()?.toLowerCase() || 'mp4';
                    const segmentFileName = `segment_${edit.id}.${fileExtension}`;
                    const folderId = driveInfo.folderIds[i];
                    previewClipUrl = await uploadClipToDrive(driveInfo.drive, folderId, segmentPath, segmentFileName);
                } catch {
                    previewClipUrl = null;
                }
            }

            segmentTranscriptions.push({
                ...edit,
                id: edit.id || `scene-${i + 1}`,
                narration: edit.narration || '',
                duration: edit.duration || formatTimeRange(originalStart, originalEnd),
                words: Number(edit.words || 0),
                startTime: originalStart,
                endTime: originalEnd,
                durationInSeconds: Number(edit.durationInSeconds || Math.max(0, originalEnd - originalStart)),
                startFrame: Number.isFinite(edit.startFrame) ? Number(edit.startFrame) : Math.max(0, Math.floor(originalStart * fps)),
                endFrame: Number.isFinite(edit.endFrame) ? Number(edit.endFrame) : Math.max(0, Math.floor(originalEnd * fps)),
                durationInFrames: Number.isFinite(edit.durationInFrames)
                    ? Number(edit.durationInFrames)
                    : Math.max(1, Math.floor(Math.max(0, originalEnd - originalStart) * fps)),
                previewClip: previewClipUrl,
                localPath: segmentPath,
            });
            previousEndTime = endTime;
        }

        return NextResponse.json({
            scenes: segmentTranscriptions
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Clip cutting failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
