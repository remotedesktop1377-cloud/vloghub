import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
// @ts-ignore - use runtime types for busboy
import Busboy from 'busboy';
import { DRIVE_CLIENT_CREDENTIALS_FILE_NAME } from '@/data/constants';
import { findOrCreateFolder, getDriveClient, getRootFolderId } from '@/services/googleDriveService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxRequestBodySize = '200mb';

export async function POST(request: NextRequest) {
    try {
        // Stream-parse multipart to handle large files
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        const bb = Busboy({ headers: { 'content-type': contentType } , defParamCharset: 'utf8', preservePath: true});
        let jobName = '';
        let targetFolder = 'input';
        let fileBufferPromise: Promise<{ buffer: Buffer; filename: string; mimeType: string } | null> | null = null as any;

        const done = new Promise<void>((resolve, reject) => {
            bb.on('field', (name: string, val: string) => {
                if (name === 'jobName') jobName = String(val).trim();
                if (name === 'targetFolder') targetFolder = String(val).trim() || 'input';
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
        if (!jobName || !fileBufferPromise) {
            return NextResponse.json({ error: 'jobName and file are required' }, { status: 400 });
        }
        const fileData: { buffer: Buffer; filename: string; mimeType: string } | null = await fileBufferPromise as any;
        if (!fileData) {
            return NextResponse.json({ error: 'File not received' }, { status: 400 });
        }

        const drive = getDriveClient();

        const ROOT_ID = getRootFolderId();
        if (!ROOT_ID) {
            return NextResponse.json({ error: 'Google Drive root folder env not set (GOOGLE_DRIVE_FOLDER_ID)' }, { status: 500 });
        }

        const project = await findOrCreateFolder(drive, jobName, ROOT_ID);

        // Support nested paths in targetFolder like "scene-1/videos"
        const segments = targetFolder.split('/').filter(Boolean);
        let currentParent = project.id;
        for (const seg of segments) {
            const next = await findOrCreateFolder(drive, seg, currentParent);
            currentParent = next.id;
        }
        const target = { id: currentParent } as any;

        const stream = Readable.from(fileData.buffer);
        const fileFileName = fileData.filename || 'video.mp4';
        const mimeType = fileData.mimeType || 'video/mp4';

        const uploaded = await drive.files.create({
            requestBody: { name: fileFileName, parents: [target.id], mimeType },
            media: { mimeType, body: stream },
            supportsAllDrives: true,
            fields: 'id, name, webViewLink',
        });

        return NextResponse.json({
            success: true,
            projectFolderId: project.id,
            targetFolderId: target.id,
            fileId: uploaded.data.id,
            fileName: uploaded.data.name,
            webViewLink: uploaded.data.webViewLink,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Upload failed', details: err.message || 'Unknown error' }, { status: 500 });
    }
}


