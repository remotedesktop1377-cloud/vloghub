import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { SceneData } from '@/types/sceneData';
import { HelperFunctions, secure } from '@/utils/helperFunctions';
import { TRENDING_TOPICS_CACHE_MAX_AGE } from '@/data/constants';
import { profileService, BackgroundItem, LibraryData } from './profileService';
import { toast } from 'react-toastify';
import { LogoOverlayInterface, SettingItemInterface, Settings } from '@/types/scriptData';

interface CachedLibraryData {
    data: LibraryData;
    timestamp: string;
}

const LIBRARY_CACHE_KEY = 'library_cache';
const BACKGROUNDS_CACHE_KEY = 'backgrounds_cache'; // Keep for backward compatibility

// Module-level variable to track background loading promise
let loadingLibraryData: boolean = false;

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
    async uploadClipsInSceneFolder(jobId: string, sceneData: SceneData, scenesCount: number): Promise<{ success: boolean; projectFolderId?: string; targetFolderId?: string; fileId?: string; fileName?: string; webViewLink?: string; }> {
        try {
            const folders = await this.generateSceneFoldersInDrive(jobId, scenesCount);
            if (!folders.success) {
                console.error('generateSceneFoldersInDrive error', folders);
                return { success: false };
            }
            const sceneFolderId = folders.result?.folderId;
            if (!sceneFolderId) {
                console.error('sceneFolderId not found');
                return { success: false };
            }
            
            // Fetch the clip file from the server
            if (!sceneData.clip) {
                console.error('No clip path provided in sceneData');
                return { success: false };
            }
            
            const clipFile = await this.fetchClipFile(sceneData.clip);
            if (!clipFile) {
                console.error('Failed to fetch clip file from server');
                return { success: false };
            }
            
            // Upload the clip to the scene folder
            const data = await this.uploadMediaToDrive(jobId, sceneData.id, clipFile);
            if (!data.success) {
                console.error('uploadMediaToDrive error', data);
                return { success: false };
            }
            return data;
        } catch (e) {
            console.error('generateSceneFolderInDrive error', e);
            return { success: false };
        }
    },
    
    /**
     * Fetch a clip file from the server using the absolute path
     * @param clipPath - Absolute path to the clip file on the server
     * @returns File object ready for upload
     */
    async fetchClipFile(clipPath: string): Promise<File | null> {
        try {
            // Encode the path for URL
            const encodedPath = encodeURIComponent(clipPath);
            const response = await fetch(`/api/serve-clip?path=${encodedPath}`);
            
            if (!response.ok) {
                console.error('Failed to fetch clip:', response.statusText);
                return null;
            }
            
            // Get the blob from the response
            const blob = await response.blob();
            
            // Extract filename from path
            const fileName = clipPath.split(/[/\\]/).pop() || 'clip.mp4';
            
            // Convert blob to File
            const file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
            
            return file;
        } catch (error) {
            console.error('Error fetching clip file:', error);
            return null;
        }
    },
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
            const settings: Settings = SceneDataWithAssets.sceneSettings as Settings;
            const sceneSettings: Settings = {
                videoLogo: settings.videoLogo as LogoOverlayInterface,
                videoBackgroundMusic: settings.videoBackgroundMusic as SettingItemInterface,
                videoBackgroundVideo: settings.videoBackgroundVideo as SettingItemInterface,
                videoTransitionEffect: settings.videoTransitionEffect as SettingItemInterface,
            };

            // Build assets with logo image and video clip included
            const existingImages: string[] = Array.isArray(SceneDataWithAssets.assets?.images) ? (SceneDataWithAssets.assets!.images as string[]) : [];
            const existingVideos: string[] = Array.isArray((SceneDataWithAssets as any).assets?.videos) ? ((SceneDataWithAssets as any).assets.videos as string[]) : [];

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
                gammaGenId: SceneDataWithAssets.gammaGenId || '',
                gammaUrl: SceneDataWithAssets.gammaUrl || '',
                gammaPreviewImage: SceneDataWithAssets.gammaPreviewImage || '',
                assets: {
                    images: existingImages,
                    ...(existingVideos.length > 0 ? { clips: existingVideos } : {}),
                },
                sceneSettings: sceneSettings,
                clip: SceneDataWithAssets.clip || '',
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

    // Library loading and caching methods
    /**
     * Load backgrounds with caching support
     * @param forceRefresh - If true, bypasses cache and fetches fresh data
     * @returns Promise<BackgroundItem[]>
     */
    async loadLibraryData(forceRefresh: boolean = false): Promise<LibraryData> {
        // If already loading, return the existing promise

        if (loadingLibraryData) {
            return Promise.resolve(null as unknown as LibraryData);
        }

        // Check cache first if not forcing refresh
        if (!forceRefresh) {
            const cached = GoogleDriveServiceFunctions.getCachedLibraryData();
            if (cached && cached.backgrounds && cached.music && cached.transitions) {
                console.log('🟡 Using cached library data');
                return cached;
            }
        }
        loadingLibraryData = true;

        // Fetch from API
        console.log(forceRefresh ? '🔄 Force refreshing backgrounds from API' : '🔄 Fetching backgrounds from API');
        const libraryData: LibraryData = await profileService.fetchLibraryData();
        GoogleDriveServiceFunctions.setCachedLibraryData(libraryData);
        loadingLibraryData = false;
        return libraryData;
    },

    getCachedLibraryData(): LibraryData | null {
        try {
            const cached = secure.j[LIBRARY_CACHE_KEY].get();
            if (cached) {
                return cached.data;
            }
        } catch (error) {
            console.warn('Error reading library cache:', error);
        }
        return null;
    },

    /**
     * Set cached library data (backgrounds, music, transitions)
     * @param data - Library data to cache
     */
    setCachedLibraryData(data: LibraryData): void {
        try {
            const cacheData: CachedLibraryData = {
                data,
                timestamp: new Date().toISOString()
            };
            secure.j[LIBRARY_CACHE_KEY].set(cacheData);
            console.log('✅ Library data cached successfully');
        } catch (error) {
            console.warn('Error writing library cache:', error);
        }
    },
};


