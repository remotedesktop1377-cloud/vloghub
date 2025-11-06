// app/api/upload-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getDriveClient, getRootFolderId, findOrCreateFolder } from '@/services/googleDriveServer';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        const isMultipart = contentType.includes('multipart/form-data');

        // Get authenticated Drive client
        const drive = getDriveClient();

        // Get root folder ID from environment
        const ROOT_ID = getRootFolderId();
        // root from env (support both var names)
        if (!ROOT_ID) {
            return NextResponse.json({ error: 'Google Drive root folder env not set (GOOGLE_DRIVE_FOLDER_ID or GOOGLE_PARENT_FOLDER_ID)' }, { status: 500 });
        }

        const form = await request.formData();
        const fileNameForm = String(form.get('fileName') || '').trim();
        const jsonDataRaw = form.get('jsonData');
        const jobId = String(form.get('jobId') || '').trim();
        const sceneId = String(form.get('sceneId') || '').trim();
        const file = form.get('file') as unknown as File | null;

        if (isMultipart) {
            // Multipart mode: supports two flows
            // 1) project JSON upload (folderName, jsonData, fileName [, file])
            // 2) scene JSON update (jobId, sceneId, jsonData [, fileName])

            if (!jsonDataRaw) {
                return NextResponse.json({ error: 'jsonData is required' }, { status: 400 });
            }

            const jsonData = typeof jsonDataRaw === 'string' ? JSON.parse(jsonDataRaw) : JSON.parse(await (jsonDataRaw as any).text());
            const project = await findOrCreateFolder(drive, jobId, ROOT_ID);
            const sceneFolder = await findOrCreateFolder(drive, sceneId, project.id);
            // console.log('project', project);
            // console.log('sceneFolder project', sceneFolder);

            if (jobId && sceneId) {
                // Upload scene media first, then replace URLs in JSON and upload JSON
                const assetsIn = jsonData?.assets || {};
                const imagesIn: string[] = Array.isArray(assetsIn.images) ? assetsIn.images : [];
                const videosIn: string[] = Array.isArray((assetsIn as any).videos) ? (assetsIn as any).videos : [];
                const keywordsSelected: Array<any> = Array.isArray(jsonData?.keywordsSelected) ? jsonData.keywordsSelected : [];
                const sceneSettings: any = jsonData?.sceneSettings || {};

                // Derive low/high res image URLs and scene logo
                const lowResUrls: string[] = [];
                const highResUrls: string[] = [];
                for (const entry of keywordsSelected) {
                    const low = entry?.media?.lowResMedia;
                    const high = entry?.media?.highResMedia;
                    if (typeof low === 'string' && low) lowResUrls.push(low);
                    if (typeof high === 'string' && high) highResUrls.push(high);
                }
                const logoUrl: string | null = (sceneSettings?.logo && typeof sceneSettings.logo.url === 'string') ? sceneSettings.logo.url : null;

                const imagesOut: string[] = [];
                const videosOut: string[] = [];

                let uploadedImages = 0;
                let uploadedVideos = 0;
                let uploadedLow = 0;
                let uploadedHigh = 0;
                let uploadedLogos = 0;
                const imagesFolder = await findOrCreateFolder(drive, 'images', sceneFolder.id);

                // if (imagesIn.length > 0) {
                //     for (let j = 0; j < imagesIn.length; j++) {
                //         const url = imagesIn[j];
                //         // Skip if this URL is already handled as low or high res upload
                //         if (lowResUrls.includes(url) || highResUrls.includes(url)) continue;
                //         try {
                //             if (url.startsWith('blob:')) throw new Error('Cannot fetch blob URL on server');
                //             const res = await fetch(url, {
                //                 headers: {
                //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                //                     'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                //                     'Referer': new URL(url).origin,
                //                 },
                //                 redirect: 'follow',
                //             });
                //             if (!res.ok) throw new Error(`download ${res.status}`);
                //             const contentType = res.headers.get('content-type') || undefined;
                //             const arrayBuffer = await res.arrayBuffer();
                //             const buffer = Buffer.from(arrayBuffer);
                //             const stream = Readable.from(buffer);
                //             const name = `${sceneId}-image-${j + 1}`;
                //             const created = await drive.files.create({
                //                 requestBody: { name, parents: [imagesFolder.id], mimeType: contentType },
                //                 media: { body: stream, mimeType: contentType },
                //                 supportsAllDrives: true,
                //                 fields: 'id, name',
                //             });
                //             if (created.data.id) {
                //                 uploadedImages += 1;
                //                 imagesOut.push(`https://drive.google.com/uc?id=${created.data.id}`);
                //             } else {
                //                 imagesOut.push(url);
                //             }
                //         } catch (e) {
                //             console.error('Image upload failed', { sceneId, url, error: (e as any)?.message });
                //             imagesOut.push(url);
                //         }
                //     }
                // }

                // Upload scene lowRes images
                if (lowResUrls.length > 0) {
                    const lowFolder = await findOrCreateFolder(drive, 'lowRes', imagesFolder?.id || sceneFolder.id);
                    for (let j = 0; j < lowResUrls.length; j++) {
                        const url = lowResUrls[j];
                        try {
                            if (url.startsWith('blob:')) throw new Error('Cannot fetch blob URL on server');
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
                            //use timestamp as name
                            const name = `${Date.now()}-${j + 1}.${contentType?.split('/')[1]}`;
                            const created = await drive.files.create({
                                requestBody: { name, parents: [lowFolder.id], mimeType: contentType },
                                media: { body: stream, mimeType: contentType },
                                supportsAllDrives: true,
                                fields: 'id, name',
                            });
                            if (created.data.id) uploadedLow += 1;
                        } catch (e) {
                            console.error('LowRes upload failed', { sceneId, url, error: (e as any)?.message });
                        }
                    }
                }

                // Upload scene highRes images
                if (highResUrls.length > 0) {
                    const highFolder = await findOrCreateFolder(drive, 'highRes', imagesFolder.id);
                    for (let j = 0; j < highResUrls.length; j++) {
                        const url = highResUrls[j];
                        try {
                            if (url.startsWith('blob:')) throw new Error('Cannot fetch blob URL on server');
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
                            //use timestamp as name
                            const name = `${Date.now()}-${j + 1}.${contentType?.split('/')[1]}`;
                            const created = await drive.files.create({
                                requestBody: { name, parents: [highFolder.id], mimeType: contentType },
                                media: { body: stream, mimeType: contentType },
                                supportsAllDrives: true,
                                fields: 'id, name',
                            });
                            if (created.data.id) uploadedHigh += 1;
                        } catch (e) {
                            console.error('HighRes upload failed', { sceneId, url, error: (e as any)?.message });
                        }
                    }
                }

                // Upload scene logo into scene-logos if present
                if (logoUrl) {
                    try {
                        if (!logoUrl.startsWith('blob:')) {
                            const logosFolder = await findOrCreateFolder(drive, 'scene-logos', imagesFolder.id);
                            const res = await fetch(logoUrl, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                                    'Referer': new URL(logoUrl).origin,
                                },
                                redirect: 'follow',
                            });
                            if (res.ok) {
                                const contentType = res.headers.get('content-type') || undefined;
                                const arrayBuffer = await res.arrayBuffer();
                                const buffer = Buffer.from(arrayBuffer);
                                const stream = Readable.from(buffer);
                                const name = `${sceneId}-logo-1`;
                                const created = await drive.files.create({
                                    requestBody: { name, parents: [logosFolder.id], mimeType: contentType },
                                    media: { body: stream, mimeType: contentType },
                                    supportsAllDrives: true,
                                    fields: 'id, name',
                                });
                                if (created.data.id) uploadedLogos += 1;
                            }
                        }
                    } catch (e) {
                        console.error('Logo upload failed', { sceneId, url: logoUrl, error: (e as any)?.message });
                    }
                }

                if (videosIn.length > 0) {
                    const videosFolder = await findOrCreateFolder(drive, 'videos', imagesFolder.id);
                    for (let j = 0; j < videosIn.length; j++) {
                        const url = videosIn[j];
                        try {
                            // Skip if already a Google Drive link (client uploaded via media-upload)
                            if (/https:\/\/drive\.google\.com\//i.test(url)) {
                                continue;
                            }
                            if (url.startsWith('blob:')) throw new Error('Cannot fetch blob URL on server');
                            const res = await fetch(url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                                    'Accept': 'video/*,*/*;q=0.8',
                                    'Referer': new URL(url).origin,
                                },
                                redirect: 'follow',
                            });
                            if (!res.ok) throw new Error(`download ${res.status}`);
                            const contentType = res.headers.get('content-type') || 'video/mp4';
                            const arrayBuffer = await res.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            const stream = Readable.from(buffer);
                            const name = `${sceneId}-video-${j + 1}`;
                            const created = await drive.files.create({
                                requestBody: { name, parents: [videosFolder.id], mimeType: contentType },
                                media: { body: stream, mimeType: contentType },
                                supportsAllDrives: true,
                                fields: 'id, name',
                            });
                            if (created.data.id) {
                                uploadedVideos += 1;
                                videosOut.push(`https://drive.google.com/uc?id=${created.data.id}`);
                            } else {
                                videosOut.push(url);
                            }
                        } catch (e) {
                            console.error('Video upload failed', { sceneId, url, error: (e as any)?.message });
                            videosOut.push(url);
                        }
                    }
                }

                // Replace assets in JSON
                const newJson = { ...jsonData, assets: { ...(jsonData.assets || {}), images: imagesOut, ...(videosOut.length ? { videos: videosOut } : {}) } };

                const jsonString = JSON.stringify(newJson, null, 2);
                const uploadedJson = await drive.files.create({
                    requestBody: { name: 'scene-config.json', parents: [sceneFolder.id], mimeType: 'application/json' },
                    media: { mimeType: 'application/json', body: jsonString },
                    supportsAllDrives: true,
                    fields: 'id, name, webViewLink, parents',
                });

                return NextResponse.json({
                    success: true,
                    projectFolderId: project.id,
                    sceneFolderId: sceneFolder.id,
                    json: {
                        fileId: uploadedJson.data.id,
                        fileName: uploadedJson.data.name,
                        webViewLink: uploadedJson.data.webViewLink
                    },
                    images: { uploaded: uploadedImages },
                    videos: { uploaded: uploadedVideos },
                    lowRes: { uploaded: uploadedLow },
                    highRes: { uploaded: uploadedHigh },
                    logos: { uploaded: uploadedLogos },
                    message: 'Scene media uploaded and JSON saved with Drive links',
                });
            }

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
                const videos: string[] = Array.isArray((assets as any).videos) ? (assets as any).videos : [];

                let uploadedCount = 0;
                let uploadedVideos = 0;
                const folders: Record<string, { id: string } | null> = {
                    'images': images.length ? await findOrCreateFolder(drive, 'images', sceneFolder.id) : null,
                    'videos': videos.length ? await findOrCreateFolder(drive, 'videos', sceneFolder.id) : null,
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

                console.log('folders', folders);
                if (folders['images']) {
                    await uploadBatch(images, folders['images'].id, `${sceneId}-images`);
                }

                if (folders['videos']) {
                    for (let j = 0; j < videos.length; j++) {
                        const url = videos[j];
                        try {
                            const res = await fetch(url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                                    'Accept': 'video/*,*/*;q=0.8',
                                    'Referer': new URL(url).origin,
                                },
                                redirect: 'follow',
                            });
                            if (!res.ok) throw new Error(`download ${res.status}`);
                            const contentType = res.headers.get('content-type') || 'video/mp4';
                            const arrayBuffer = await res.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            const stream = Readable.from(buffer);
                            const name = `${sceneId}-video-${j + 1}`;
                            const created = await drive.files.create({
                                requestBody: { name, parents: [folders['videos']!.id], mimeType: contentType },
                                media: { body: stream, mimeType: contentType },
                                supportsAllDrives: true,
                                fields: 'id, name',
                            });
                            if (created.data.id) uploadedVideos += 1;
                        } catch (e) {
                            console.error('Video upload failed', { sceneId, url, error: (e as any)?.message });
                        }
                    }
                }

                scenesSummary.push({ sceneId, uploaded: uploadedCount + uploadedVideos, folderId: sceneFolder.id });
            }

            // // Upload optional chroma key file to input folder
            // let chromaInfo: { id?: string; name?: string; webViewLink?: string } | null = null;
            // if (file) {
            //     const arrayBuffer = await (file as any).arrayBuffer();
            //     const buffer = Buffer.from(arrayBuffer);
            //     const stream = Readable.from(buffer);
            //     const fileFileName = (file as any).name || 'chroma-key.mp4';
            //     const mimeType = (file as any).type || 'video/mp4';
            //     const uploadedFile = await drive.files.create({
            //         requestBody: { name: fileFileName, parents: [sceneFolder.id], mimeType },
            //         media: { mimeType, body: stream },
            //         supportsAllDrives: true,
            //         fields: 'id, name, webViewLink',
            //     });
            //     chromaInfo = {
            //         id: uploadedFile.data.id || undefined,
            //         name: uploadedFile.data.name || undefined,
            //         webViewLink: uploadedFile.data.webViewLink || undefined
            //     };
            // }

            return NextResponse.json({
                success: true,
                images: { scenes: scenesSummary },
                // chromaKey: chromaInfo,
                message: 'Scene images uploaded successfully',
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
