// app/api/upload-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

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
        const contentType = request.headers.get('content-type') || '';
        const isMultipart = contentType.includes('multipart/form-data');

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

        if (isMultipart) {
            // Multipart mode: folderName, jsonData (string), fileName, optional file (chroma key)
            const form = await request.formData();
            const folderName = String(form.get('folderName') || '').trim();
            const fileName = String(form.get('fileName') || 'project-config.json').trim();
            const jsonDataRaw = form.get('jsonData');
            const file = form.get('file') as unknown as File | null;

            if (!folderName || !jsonDataRaw) {
                return NextResponse.json({ error: 'folderName and jsonData are required' }, { status: 400 });
            }

            const jsonData = typeof jsonDataRaw === 'string' ? JSON.parse(jsonDataRaw) : JSON.parse(await (jsonDataRaw as any).text());

            const project = await findOrCreateFolder(drive, folderName, ROOT_ID);
            const input = await findOrCreateFolder(drive, 'input', project.id);

            // Upload JSON
            const jsonString = JSON.stringify(jsonData, null, 2);
            const uploadedJson = await drive.files.create({
                requestBody: { name: fileName, parents: [input.id], mimeType: 'application/json' },
                media: { mimeType: 'application/json', body: jsonString },
                supportsAllDrives: true,
                fields: 'id, name, webViewLink, parents',
            });

            // Upload scene images
            const scenesSummary: Array<{ sceneId: string | number; uploaded: number; folderId: string }> = [];
            const scriptChapters: any[] = Array.isArray(jsonData?.script) ? jsonData.script : [];

            for (let i = 0; i < scriptChapters.length; i++) {
                const chapter = scriptChapters[i];
                const sceneId = chapter?.id ?? i + 1;
                const sceneFolderName = `${sceneId}`;
                const sceneFolder = await findOrCreateFolder(drive, sceneFolderName, project.id);

                const assets = chapter?.assets || {};
                const imagesGoogle: string[] = Array.isArray(assets.imagesGoogle) ? assets.imagesGoogle : [];
                const imagesEnvato: string[] = Array.isArray(assets.imagesEnvato) ? assets.imagesEnvato : [];

                let uploadedCount = 0;
                const folders: Record<string, { id: string } | null> = {
                    'google-images': imagesGoogle.length ? await findOrCreateFolder(drive, 'google-images', sceneFolder.id) : null,
                    'envato-images': imagesEnvato.length ? await findOrCreateFolder(drive, 'envato-images', sceneFolder.id) : null,
                };

                const uploadBatch = async (urls: string[], parentId: string, prefix: string) => {
                    for (let j = 0; j < urls.length; j++) {
                        const url = urls[j];
                        try {
                            const res = await fetch(url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                                    'Referer': new URL(url).origin,
                                },
                                redirect: 'follow',
                            });
                            if (!res.ok) throw new Error(`download ${res.status}`);
                            const contentType = res.headers.get('content-type') || undefined;
                            const arrayBuffer = await res.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            const stream = Readable.from(buffer);
                            const name = `${prefix}-${j + 1}`;
                            const created = await drive.files.create({
                                requestBody: { name, parents: [parentId], mimeType: contentType },
                                media: { body: stream, mimeType: contentType },
                                supportsAllDrives: true,
                                fields: 'id, name',
                            });
                            if (created.data.id) uploadedCount += 1;
                        } catch (e) {
                            console.error('Image upload failed', { sceneId, url, error: (e as any)?.message });
                        }
                    }
                };

                if (folders['google-images']) {
                    await uploadBatch(imagesGoogle, folders['google-images'].id, `${sceneId}-google`);
                }
                if (folders['envato-images']) {
                    await uploadBatch(imagesEnvato, folders['envato-images'].id, `${sceneId}-envato`);
                }

                scenesSummary.push({ sceneId, uploaded: uploadedCount, folderId: sceneFolder.id });
            }

            // Upload optional chroma key file to input folder
            let chromaInfo: { id?: string; name?: string; webViewLink?: string } | null = null;
            if (file) {
                const arrayBuffer = await (file as any).arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const stream = Readable.from(buffer);
                const fileFileName = (file as any).name || 'chroma-key.mp4';
                const mimeType = (file as any).type || 'video/mp4';
                const uploadedFile = await drive.files.create({
                    requestBody: { name: fileFileName, parents: [input.id], mimeType },
                    media: { mimeType, body: stream },
                    supportsAllDrives: true,
                    fields: 'id, name, webViewLink',
                });
                chromaInfo = {
                    id: uploadedFile.data.id || undefined,
                    name: uploadedFile.data.name || undefined,
                    webViewLink: uploadedFile.data.webViewLink || undefined
                };
            }

            return NextResponse.json({
                success: true,
                projectFolderId: project.id,
                inputFolderId: input.id,
                json: {
                    fileId: uploadedJson.data.id,
                    fileName: uploadedJson.data.name,
                    webViewLink: uploadedJson.data.webViewLink
                },
                images: { scenes: scenesSummary },
                chromaKey: chromaInfo,
                message: 'Uploaded JSON, scene images and optional chroma key file',
            });
        } else {
            // JSON-only mode (backwards compatible)
            const { jsonData, fileName, folderName } = await request.json();

            if (!jsonData || !fileName || !folderName) {
                return NextResponse.json(
                    { error: 'jsonData, fileName and folderName are required' },
                    { status: 400 }
                );
            }

            const project = await findOrCreateFolder(drive, folderName, ROOT_ID);
            const input = await findOrCreateFolder(drive, 'input', project.id);

            const jsonString = JSON.stringify(jsonData, null, 2);
            const uploaded = await drive.files.create({
                requestBody: { name: fileName, parents: [input.id], mimeType: 'application/json' },
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
        }
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { error: 'Upload failed', details: err.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
