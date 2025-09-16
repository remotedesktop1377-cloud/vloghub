import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export const runtime = 'nodejs';

async function findOrCreateFolder(drive: any, name: string, parentId: string) {
    const q = [
        `name = '${name.replace(/'/g, "\\'")}'`,
        "mimeType = 'application/vnd.google-apps.folder'",
        `'${parentId}' in parents`,
        'trashed = false'
    ].join(' and ');

    const res = await drive.files.list({
        q,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 1,
    });

    if (res.data.files && res.data.files.length > 0) {
        return { id: res.data.files[0].id, created: false };
    }

    const created = await drive.files.create({
        requestBody: {
            name,
            parents: [parentId],
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id, name',
        supportsAllDrives: true,
    });

    return { id: created.data.id!, created: true };
}

export async function POST(request: NextRequest) {
    try {
        const form = await request.formData();
        const jobName = String(form.get('jobName') || '').trim();
        const targetFolder = String(form.get('targetFolder') || 'input').trim();
        const file = form.get('file') as unknown as File | null;

        if (!jobName || !file) {
            return NextResponse.json({ error: 'jobName and file are required' }, { status: 400 });
        }

        const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        const jwtClient = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth: jwtClient });

        const ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
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

        const arrayBuffer = await (file as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);
        const fileFileName = (file as any).name || 'video.mp4';
        const mimeType = (file as any).type || 'video/mp4';

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


