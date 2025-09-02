// app/api/upload-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

// helper: find or create folder under parent
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
        const { jsonData, fileName, folderName } = await request.json();

        if (!jsonData || !fileName || !folderName) {
            return NextResponse.json(
                { error: 'jsonData, fileName and folderName are required' },
                { status: 400 }
            );
        }

        // service account credentials
        const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

        const jwtClient = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth: jwtClient });

        // root from env
        const ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!ROOT_ID) {
            return NextResponse.json({ error: 'GOOGLE_DRIVE_FOLDER_ID not set' }, { status: 500 });
        }

        // 1. Create/find project folder
        const project = await findOrCreateFolder(drive, folderName, ROOT_ID);

        // 2. Create/find input subfolder
        const input = await findOrCreateFolder(drive, 'input', project.id);

        // 3. Upload file into input folder
        const jsonString = JSON.stringify(jsonData, null, 2);
        const uploaded = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [input.id],
                mimeType: 'application/json',
            },
            media: { mimeType: 'application/json', body: jsonString },
            supportsAllDrives: true,
            fields: 'id, name, webViewLink, parents',
        });

        return NextResponse.json({
            success: true,
            path: `${folderName}/input/${fileName}`,
            projectFolderId: project.id,
            inputFolderId: input.id,
            fileId: uploaded.data.id,
            fileName: uploaded.data.name,
            webViewLink: uploaded.data.webViewLink,
            message: 'File uploaded successfully',
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { error: 'Upload failed', details: err.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
