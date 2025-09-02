// app/api/upload-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Force Node.js runtime (required for fs/path)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { jsonData, fileName } = await request.json();

        if (!jsonData || !fileName) {
            return NextResponse.json(
                { error: 'JSON data and fileName are required' },
                { status: 400 }
            );
        }

        // 1) Load service account credentials from file (your current approach)
        //    If you later move to env vars, see the alternative block below.
        const credentialsPath = path.join(
            process.cwd(),
            'src',
            'config',
            'gen-lang-client-0211941879-57f306607431.json'
        );

        let credentials: {
            client_email: string;
            private_key: string;
            project_id?: string;
            private_key_id?: string;
        };

        try {
            const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
            credentials = JSON.parse(credentialsFile);
        } catch (err) {
            console.error('Failed to read service account file:', err);
            return NextResponse.json(
                {
                    error:
                        'Google Drive service account file not found or invalid at src/config/gen-lang-client-0211941879-57f306607431.json',
                },
                { status: 500 }
            );
        }

        // 2) Target folder (must be shared with the service account email)
        //    Prefer storing this in an env var in production.
        const TARGET_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!TARGET_FOLDER_ID) {
            return NextResponse.json(
                {
                    error:
                        'Google Drive folder ID not configured. Set GOOGLE_DRIVE_FOLDER_ID.',
                },
                { status: 500 }
            );
        }

        // 3) Create auth client (use full drive scope for fewer surprises)
        const jwtClient = new google.auth.JWT({
            email: credentials.client_email,
            // If you later load from env, remember to .replace(/\\n/g, '\n')
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth: jwtClient });

        // 4) Ensure target folder is accessible; include supportsAllDrives for Shared Drives
        let targetFolderId = TARGET_FOLDER_ID;
        try {
            await drive.files.get({
                fileId: targetFolderId,
                fields: 'id, name, driveId, parents',
                supportsAllDrives: true,
            });
        } catch (folderError: any) {
            const status = folderError?.code || folderError?.response?.status;

            if (status === 404) {
                return NextResponse.json(
                    {
                        error: 'Target folder not found (404).',
                        hint:
                            'Verify the folder ID and that the service account has at least Editor access to that folder.',
                        serviceAccount: credentials.client_email,
                        folderId: targetFolderId,
                    },
                    { status: 404 }
                );
            }

            if (status === 403) {
                return NextResponse.json(
                    {
                        error:
                            'Forbidden (403). The service account likely lacks permission on the target folder.',
                        hint:
                            'Share the folder with the service account email as Editor, or switch to domain-wide delegation.',
                        serviceAccount: credentials.client_email,
                        folderId: targetFolderId,
                    },
                    { status: 403 }
                );
            }

            // If unknown, surface message
            return NextResponse.json(
                {
                    error: 'Failed to access target folder.',
                    details:
                        folderError?.message ||
                        folderError?.response?.data ||
                        'Unknown error',
                },
                { status: 500 }
            );
        }

        // 5) Upload JSON (multipart). supportsAllDrives must be true for shared drives.
        const jsonString = JSON.stringify(jsonData, null, 2);

        const createRes = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [targetFolderId],
                mimeType: 'application/json',
            },
            media: {
                mimeType: 'application/json',
                body: jsonString,
            },
            supportsAllDrives: true,
            fields: 'id, name, webViewLink, webContentLink, parents',
        });

        const fileId = createRes.data.id!;
        const webViewLink =
            createRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

        return NextResponse.json({
            success: true,
            fileId,
            fileName: createRes.data.name,
            webViewLink,
            parents: createRes.data.parents,
            message: 'File uploaded successfully to Google Drive.',
        });
    } catch (error: any) {
        console.error('Google Drive upload error:', error);
        const status =
            error?.code ||
            error?.response?.status ||
            (typeof error?.message === 'string' &&
                /invalid_grant|unauthorized_client/i.test(error.message)
                ? 401
                : 500);

        return NextResponse.json(
            {
                error: 'Google Drive upload failed',
                details:
                    error?.response?.data?.error?.message ||
                    error?.message ||
                    'Unknown error',
            },
            { status }
        );
    }
}

/* ---------- OPTIONAL: env-based credentials (instead of reading a file) ----------
   Set:
     GDRIVE_CLIENT_EMAIL="beehive@gen-lang-client-0211941879.iam.gserviceaccount.com"
     GDRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   Then build the JWT like:

   const jwtClient = new google.auth.JWT({
     email: process.env.GDRIVE_CLIENT_EMAIL,
     key: (process.env.GDRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
     scopes: ['https://www.googleapis.com/auth/drive'],
   });
----------------------------------------------------------------------------- */
