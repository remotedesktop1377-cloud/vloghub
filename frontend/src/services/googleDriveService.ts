import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { SceneData } from '@/types/sceneData';
import { HelperFunctions } from '@/utils/helperFunctions';

/**
 * Get authenticated Google Drive JWT Client
 * @param scopes - Google Drive scopes (default: full drive access)
 * @returns Authenticated JWT client
 */
// Server-only helpers were moved to googleDriveServer.ts to avoid bundling Node modules in the client

// ---------------- Client-side helpers for calling our API routes ----------------

function dataUrlToFile(dataUrl: string, fileName: string): File {
    const matches = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    const mime = matches?.[1] || 'image/png';
    const b64 = matches?.[2] || '';
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return new File([blob], fileName, { type: mime });
}

export const GoogleDriveServiceFunctions = {
    /**
 * Upload a media file (e.g., chroma key or any video) to Google Drive under the given job folder and target subfolder.
 * Returns Drive identifiers on success.
 */
    async uploadMediaToDrive(jobId: string, targetFolder: string, file: File): Promise<{ success: boolean; projectFolderId?: string; targetFolderId?: string; fileId?: string; fileName?: string; webViewLink?: string; }> {
        try {
            const form = new FormData();
            form.append('jobName', jobId);
            form.append('targetFolder', targetFolder || 'input');
            form.append('file', file);

            const res = await fetch(API_ENDPOINTS.API_API_GOOGLE_DRIVE_MEDIA_UPLOAD, { method: 'POST', body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.error || data?.details || 'Media upload failed');
            }
            return data;
        } catch (e: any) {
            console.error('uploadMediaToDrive error', e);
            return { success: false };
        }
    },

    async uploadContentToDrive(form: FormData): Promise<{ success: boolean; result: any }> {
        try {
            const response = await fetch(API_ENDPOINTS.API_GOOGLE_DRIVE_UPLOAD, { method: 'POST', body: form });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { success: false, result: result?.error || result?.details || 'Failed to upload to Google Drive' };
            }
            return { success: true, result };
        } catch (e: any) {
            return { success: false, result: e?.message || 'Unknown error' };
        }
    },

    /**
   * Persist a SceneData scene change to Drive and show toast feedback
   */
    async persistSceneUpdate(
        jobId: string,
        sceneData: SceneData,
        successMessage: string = 'Scene updated on Drive'
    ): Promise<void> {
        try {
            // const jobName = String((SceneData as any).jobName || jobInfo?.jobName || '');
            if (!jobId || !sceneData) return;
            const ok = await GoogleDriveServiceFunctions.updateSceneDataceneOnDrive(jobId, sceneData);
            if (ok) {
                HelperFunctions.showSuccess(successMessage);
            } else {
                HelperFunctions.showError('Failed to update scene on Drive');
            }
        } catch (e) {
            console.error('persistSceneUpdate error', e);
            HelperFunctions.showError('Failed to update scene on Drive');
        }
    },

    async updateSceneDataceneOnDrive(jobId: string, sceneData: SceneData): Promise<boolean> {
        try {
            const SceneDataWithAssets = HelperFunctions.ensureAssetsContainKeywordMedia(sceneData);
            const ve: any = (SceneDataWithAssets as any).videoEffects || {};
            const sceneSettings = {
                transition: ve.transition || '',
                backgroundMusic: ve.backgroundMusic && typeof ve.backgroundMusic === 'object'
                    ? ({ selectedMusic: ve.backgroundMusic.selectedMusic || '' } as any)
                    : null,
                logo: ve.logo || null,
                clip: ve.clip || null,
                transitionEffects: Array.isArray(ve.transitionEffects) ? ve.transitionEffects : [],
            };

            // Build assets with logo image and video clip included
            const existingImages: string[] = Array.isArray(SceneDataWithAssets.assets?.images) ? (SceneDataWithAssets.assets!.images as string[]) : [];
            const logoUrl: string | undefined = ve?.logo?.url;
            const mergedImages = Array.from(new Set<string>([
                ...existingImages,
                ...(logoUrl ? [logoUrl] : []),
            ].filter(Boolean) as string[]));

            const existingVideos: string[] = Array.isArray((SceneDataWithAssets as any).assets?.videos) ? ((SceneDataWithAssets as any).assets.videos as string[]) : [];
            let mergedVideos = existingVideos;
            const clipUrl: string | undefined = ve?.clip?.url;
            if (clipUrl) {
                try {
                    // Upload clip to Drive/videos for this scene folder path and use returned link
                    const jobFolderName = jobId || `job-${HelperFunctions.generateRandomId()}`;
                    const uploadResult = await GoogleDriveServiceFunctions.uploadMediaToDrive(jobFolderName, `${sceneData.id}/images/videos`, await HelperFunctions.fetchBlobAsFile(clipUrl, ve?.clip?.name || 'clip.mp4'));
                    if (uploadResult && uploadResult.success && uploadResult.fileId) {
                        mergedVideos = Array.from(new Set<string>([...existingVideos, `https://drive.google.com/uc?id=${uploadResult.fileId}`]));
                    } else {
                        mergedVideos = Array.from(new Set<string>([...existingVideos, clipUrl]));
                    }
                } catch {
                    mergedVideos = Array.from(new Set<string>([...existingVideos, clipUrl]));
                }
            }
            const scene = {
                id: SceneDataWithAssets.id,
                narration: SceneDataWithAssets.narration,
                duration: SceneDataWithAssets.duration,
                durationInSeconds: (SceneDataWithAssets as any).durationInSeconds,
                words: (SceneDataWithAssets as any).words,
                startTime: (SceneDataWithAssets as any).startTime,
                endTime: (SceneDataWithAssets as any).endTime,
                highlightedKeywords: SceneDataWithAssets.highlightedKeywords || [],
                keywordsSelected: Array.isArray((SceneDataWithAssets as any).keywordsSelected) ? (SceneDataWithAssets as any).keywordsSelected : [],
                assets: {
                    images: mergedImages,
                    ...(mergedVideos.length > 0 ? { videos: mergedVideos } : {}),
                },
                sceneSettings,
                previewImageWebviewLink: SceneDataWithAssets.previewImageWebviewLink || '',
            };
            console.log('Updating scene on Drive:', scene);

            const form = new FormData();
            // Pass job folder and scene folder separately so backend can resolve path as jobs/<folderName>/<sceneFolderId>/
            form.append('jobId', jobId);
            form.append('sceneId', sceneData.id);
            form.append('fileName', 'scene-config.json');
            form.append('jsonData', JSON.stringify(scene));

            const res = await fetch(API_ENDPOINTS.API_GOOGLE_DRIVE_SCENE_UPLOAD, {
                method: 'POST',
                body: form
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || err?.details || 'Drive scene update failed');
            }
            return true;
        } catch (e) {
            console.error('updateSceneDataceneOnDrive error', e);
            return false;
        }
    },

    async generateAFolderOnDrive(jobId: string): Promise<{ success: boolean; result: { folderId: string; webViewLink: string } | null; message?: string }> {
        try {
            const form = new FormData();
            form.append('jobName', jobId);
            const res = await fetch(API_ENDPOINTS.API_GOOGLE_DRIVE_GENERATE_FOLDER, { method: 'POST', body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || data?.error || data?.details || 'Failed to generate folder');
            return { success: true, result: data.result, message: data.message };
        } catch (e: any) {
            return { success: false, result: null, message: e?.message || 'Unknown error' };
        }
    },

    async generateSceneFoldersInDrive(jobId: string, numberOfScenes: number): Promise<{ success: boolean; result: { folderId: string; webViewLink: string } | null; message?: string }> {
        try {
            const form = new FormData();
            form.append('jobName', jobId);
            form.append('numberOfScenes', String(numberOfScenes));
            const res = await fetch(API_ENDPOINTS.API_GOOGLE_DRIVE_GENERATE_SCENE_FOLDERS, { method: 'POST', body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || data?.error || data?.details || 'Failed to generate scene folders');
            return { success: true, result: data.result, message: data.message };
        } catch (e: any) {
            return { success: false, result: null, message: e?.message || 'Unknown error' };
        }
    },

    async uploadPreviewDataUrl(jobId: string, sceneId: string | number, dataUrl: string): Promise<{ success: boolean; result?: any; message?: string }> {
        try {
            const file = dataUrlToFile(dataUrl, 'preview.png');
            return await this.uploadPreviewFile(jobId, sceneId, file);
        } catch (e: any) {
            return { success: false, message: e?.message || 'Invalid preview image' };
        }
    },

    async uploadPreviewFile(jobId: string, sceneId: string | number, file: File): Promise<{ success: boolean; result?: any; message?: string }> {
        try {
            const form = new FormData();
            form.append('jobName', jobId);
            form.append('targetFolder', `${sceneId}/images/preview`);
            form.append('file', file);
            const res = await fetch(API_ENDPOINTS.API_API_GOOGLE_DRIVE_MEDIA_UPLOAD, { method: 'POST', body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || data?.details || 'Failed to upload preview image');
            return { success: true, result: data };
        } catch (e: any) {
            return { success: false, message: e?.message || 'Unknown error' };
        }
    },
};


