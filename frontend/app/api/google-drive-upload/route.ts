// app/api/upload-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getDriveClient, getRootFolderId, findOrCreateFolder } from '@/services/googleDriveService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        const isMultipart = contentType.includes('multipart/form-data');

        // Get authenticated Drive client
        const drive = getDriveClient();

        // Get root folder ID from environment
        const ROOT_ID = getRootFolderId();

        if (isMultipart) {
            // Multipart mode: folderName, jsonData (string), fileName, optional file (chroma key)

            const form = await request.formData();
            const jobName = String(form.get('jobName') || '').trim();
            const fileName = String(form.get('fileName') || 'project-config.json').trim();
            const jsonDataRaw = form.get('jsonData');
            const file = form.get('file') as unknown as File | null;

            if (!jobName || !jsonDataRaw) {
                return NextResponse.json({ error: 'folderName and jsonData are required' }, { status: 400 });
            }

            const jsonData = typeof jsonDataRaw === 'string' ? JSON.parse(jsonDataRaw) : JSON.parse(await (jsonDataRaw as any).text());

            const project = await findOrCreateFolder(drive, jobName, ROOT_ID);
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
            const scriptSceneData: any[] = Array.isArray(jsonData?.script) ? jsonData.script : [];

            for (let i = 0; i < scriptSceneData.length; i++) {
                const SceneData = scriptSceneData[i];
                const sceneId = SceneData?.id ?? i + 1;
                const sceneFolderName = `${sceneId}`;
                const sceneFolder = await findOrCreateFolder(drive, sceneFolderName, project.id);

                const assets = SceneData?.assets || {};
                const images: string[] = Array.isArray(assets.images) ? assets.images : [];
                const imagesGoogle: string[] = Array.isArray(assets.imagesGoogle) ? assets.imagesGoogle : [];
                const imagesEnvato: string[] = Array.isArray(assets.imagesEnvato) ? assets.imagesEnvato : [];

                let uploadedCount = 0;
                const folders: Record<string, { id: string } | null> = {
                    'images': images.length ? await findOrCreateFolder(drive, 'images', sceneFolder.id) : null,
                    // 'google-images': imagesGoogle.length ? await findOrCreateFolder(drive, 'google-images', sceneFolder.id) : null,
                    // 'envato-images': imagesEnvato.length ? await findOrCreateFolder(drive, 'envato-images', sceneFolder.id) : null,
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

                if (folders['images']) {
                    // Upload the combined scene images (SceneData.assets.images)
                    await uploadBatch(images, folders['images'].id, `${sceneId}-images`);
                }
                // if (folders['google-images']) {
                //     await uploadBatch(imagesGoogle, folders['google-images'].id, `${sceneId}-google`);
                // }
                // if (folders['envato-images']) {
                //     await uploadBatch(imagesEnvato, folders['envato-images'].id, `${sceneId}-envato`);
                // }

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
