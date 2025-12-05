import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
// @ts-ignore - use runtime types for busboy
import Busboy from 'busboy';
import {
    findOrCreateFolder,
    getDriveClient,
    getJWTClient,
    getRootFolderId,
} from '@/services/googleDriveServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxRequestBodySize = '200mb';

type UploadAction = 'single' | 'init-resumable' | 'upload-chunk';

export async function POST(request: NextRequest) {
    try {
        // Stream-parse multipart to handle large files
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        const bb = Busboy({ headers: { 'content-type': contentType }, defParamCharset: 'utf8', preservePath: true });
        const fields: Record<string, string> = {};
        let fileBufferPromise: Promise<{ buffer: Buffer; filename: string; mimeType: string } | null> | null = null as any;

        const done = new Promise<void>((resolve, reject) => {
            bb.on('field', (name: string, val: string) => {
                fields[name] = val;
            });

            bb.on('file', (name: string, fileStream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
                const chunks: Buffer[] = [];
                const { filename, mimeType } = info;
                fileStream.on('data', (data: Buffer) => chunks.push(data));
                fileStream.on('limit', () => reject(new Error('File too large')));
                fileStream.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    fileBufferPromise = Promise.resolve({ buffer, filename, mimeType });
                });
            });

            bb.on('error', reject);
            bb.on('finish', resolve);
        });

        const body = request.body;
        if (!body) return NextResponse.json({ error: 'Empty body' }, { status: 400 });
        // Pipe the web ReadableStream into Busboy as a Node stream to avoid truncation issues
        const nodeStream = Readable.fromWeb(body as any);
        nodeStream.on('error', (err) => bb.emit('error', err as any));
        nodeStream.pipe(bb, { end: true });

        await done;
        const jobName = (fields['jobName'] || '').trim();
        const targetFolder = (fields['targetFolder'] || 'input').trim() || 'input';
        const action = (fields['action'] as UploadAction) || 'single';
        const fileData: { buffer: Buffer; filename: string; mimeType: string } | null = await (fileBufferPromise || Promise.resolve(null as any));
        const mimeType = (fields['mimeType'] || fileData?.mimeType || 'video/mp4').trim();

        if (action === 'init-resumable') {
            if (!jobName) {
                return NextResponse.json({ error: 'jobName is required' }, { status: 400 });
            }
            const fileName = (fields['fileName'] || fileData?.filename || 'video.mp4').trim();
            const fileSize = Number(fields['fileSize'] || '0');
            if (!fileName || !fileSize) {
                return NextResponse.json({ error: 'fileName and fileSize are required for resumable uploads' }, { status: 400 });
            }
            return await handleInitResumableUpload(jobName, targetFolder, fileName, mimeType, fileSize);
        }

        if (action === 'upload-chunk') {
            if (!jobName) {
                return NextResponse.json({ error: 'jobName is required' }, { status: 400 });
            }
            if (!fileData) {
                return NextResponse.json({ error: 'Chunk payload missing file data' }, { status: 400 });
            }
            const sessionUrl = fields['sessionUrl'];
            if (!sessionUrl) {
                return NextResponse.json({ error: 'sessionUrl is required for chunk uploads' }, { status: 400 });
            }
            const chunkStart = Number(fields['chunkStart'] || '0');
            const chunkEnd = Number(fields['chunkEnd'] || '0');
            const fileSize = Number(fields['fileSize'] || '0');
            const projectFolderId = fields['projectFolderId'];
            const targetFolderId = fields['targetFolderId'];

            if (!Number.isFinite(chunkStart) || !Number.isFinite(chunkEnd) || !Number.isFinite(fileSize) || !fileSize) {
                return NextResponse.json({ error: 'Invalid chunk metadata' }, { status: 400 });
            }

            return await handleChunkUpload({
                sessionUrl,
                chunkStart,
                chunkEnd,
                fileSize,
                chunkBuffer: fileData.buffer,
                mimeType,
                projectFolderId,
                targetFolderId,
            });
        }

        if (!jobName || !fileData) {
            return NextResponse.json({ error: 'jobName and file are required' }, { status: 400 });
        }

        return await handleSingleUpload(jobName, targetFolder, {
            buffer: fileData.buffer,
            filename: fileData.filename,
            mimeType,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Upload failed', details: err.message || 'Unknown error' }, { status: 500 });
    }
}

async function handleSingleUpload(
    jobName: string,
    targetFolder: string,
    fileData: { buffer: Buffer; filename: string; mimeType: string },
) {
    const { drive, projectFolderId, targetFolderId } = await resolveDriveContext(jobName, targetFolder);
    const stream = Readable.from(fileData.buffer);
    const fileFileName = fileData.filename || 'video.mp4';
    const mimeType = fileData.mimeType || 'video/mp4';

    const uploaded = await drive.files.create({
        requestBody: { name: fileFileName, parents: [targetFolderId], mimeType },
        media: { mimeType, body: stream },
        supportsAllDrives: true,
        fields: 'id, name, webViewLink',
    });

    if (uploaded.data.id) {
        try {
            const permissionResult = await drive.permissions.create({
                fileId: uploaded.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                    allowFileDiscovery: false,
                },
                supportsAllDrives: true,
            });
            console.log(`✅ Set public permissions for file: ${uploaded.data.id}`, permissionResult.data);
            
            await drive.files.update({
                fileId: uploaded.data.id,
                requestBody: {
                    copyRequiresWriterPermission: false,
                },
                supportsAllDrives: true,
            });
        } catch (e: any) {
            console.error('❌ Failed to set Drive permissions:', e?.message || e);
            console.error('Permission error details:', JSON.stringify(e, null, 2));
        }
    }

    return NextResponse.json({
        success: true,
        projectFolderId,
        targetFolderId,
        fileId: uploaded.data.id,
        fileName: uploaded.data.name,
        webViewLink: uploaded.data.webViewLink,
    });
}

async function handleInitResumableUpload(
    jobName: string,
    targetFolder: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
) {
    const { projectFolderId, targetFolderId } = await resolveDriveContext(jobName, targetFolder);
    const sessionUrl = await createResumableSession(targetFolderId, fileName, mimeType, fileSize);

    return NextResponse.json({
        success: true,
        projectFolderId,
        targetFolderId,
        sessionUrl,
    });
}

async function handleChunkUpload(params: {
    sessionUrl: string;
    chunkStart: number;
    chunkEnd: number;
    fileSize: number;
    chunkBuffer: Buffer;
    mimeType: string;
    projectFolderId?: string;
    targetFolderId?: string;
}) {
    const { sessionUrl, chunkStart, chunkEnd, fileSize, chunkBuffer, mimeType, projectFolderId, targetFolderId } = params;
    const token = await getAccessToken();
    const chunkView = new Uint8Array(chunkBuffer.buffer, chunkBuffer.byteOffset, chunkBuffer.byteLength);
    const response = await fetch(sessionUrl, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Length': String(chunkBuffer.length),
            'Content-Type': mimeType || 'application/octet-stream',
            'Content-Range': `bytes ${chunkStart}-${chunkEnd - 1}/${fileSize}`,
        },
        body: chunkView as any,
    });

    if (response.status === 308) {
        return NextResponse.json({
            success: true,
            chunkUploaded: true,
            nextByte: Number(response.headers.get('Range')?.split('-')[1] || chunkEnd - 1) + 1,
        });
    }

    const payloadText = await response.text();
    let payloadJson: any = {};
    try {
        payloadJson = payloadText ? JSON.parse(payloadText) : {};
    } catch {
        payloadJson = {};
    }

    if (!response.ok) {
        return NextResponse.json(
            { error: payloadJson?.error || payloadText || 'Chunk upload failed' },
            { status: response.status },
        );
    }

    if (payloadJson?.id) {
        try {
            const permResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${payloadJson.id}/permissions?supportsAllDrives=true`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify({
                        role: 'reader',
                        type: 'anyone',
                        allowFileDiscovery: false,
                    }),
                },
            );
            if (!permResponse.ok) {
                const permText = await permResponse.text().catch(() => '');
                const permJson = await permResponse.json().catch(() => ({}));
                console.error('❌ Failed to set Drive permission:', permText);
                console.error('Permission error details:', JSON.stringify(permJson, null, 2));
            } else {
                const permData = await permResponse.json().catch(() => ({}));
                console.log(`✅ Set public permissions for file: ${payloadJson.id}`, permData);
            }
        } catch (e: any) {
            console.error('❌ Error setting Drive permissions:', e?.message || e);
            console.error('Permission error details:', JSON.stringify(e, null, 2));
        }
    }

    return NextResponse.json({
        success: true,
        projectFolderId,
        targetFolderId,
        fileId: payloadJson.id,
        fileName: payloadJson.name,
        webViewLink: payloadJson.webViewLink,
    });
}

async function resolveDriveContext(jobName: string, targetFolder: string) {
    const drive = getDriveClient();
    const ROOT_ID = getRootFolderId();
    if (!ROOT_ID) {
        throw new Error('Google Drive root folder env not set (GOOGLE_DRIVE_FOLDER_ID)');
    }

    const project = await findOrCreateFolder(drive, jobName, ROOT_ID);
    const segments = targetFolder.split('/').filter(Boolean);
    let currentParent = project.id;
    for (const seg of segments) {
        const next = await findOrCreateFolder(drive, seg, currentParent);
        currentParent = next.id;
    }

    return {
        drive,
        projectFolderId: project.id,
        targetFolderId: currentParent,
    };
}

async function createResumableSession(targetFolderId: string, fileName: string, mimeType: string, fileSize: number) {
    const jwtClient = getJWTClient('https://www.googleapis.com/auth/drive');
    const tokens = await jwtClient.authorize();
    if (!tokens?.access_token) {
        throw new Error('Failed to authorize Drive client');
    }

    const initUrl =
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink';
    const initResponse = await fetch(initUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType || 'application/octet-stream',
            'X-Upload-Content-Length': String(fileSize),
        },
        body: JSON.stringify({
            name: fileName,
            parents: [targetFolderId],
            mimeType,
        }),
    });

    if (!initResponse.ok) {
        const errTxt = await initResponse.text().catch(() => '');
        throw new Error(errTxt || 'Failed to initiate Drive upload session');
    }
    const sessionUrl = initResponse.headers.get('location');
    if (!sessionUrl) {
        throw new Error('Drive upload session url missing');
    }
    return sessionUrl;
}

async function getAccessToken() {
    const jwtClient = getJWTClient('https://www.googleapis.com/auth/drive');
    const tokens = await jwtClient.authorize();
    if (!tokens?.access_token) {
        throw new Error('Failed to authorize Drive client');
    }
    return tokens.access_token;
}


