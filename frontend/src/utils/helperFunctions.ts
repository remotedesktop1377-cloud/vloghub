import { SceneData } from '../types/sceneData';
import { ScriptData } from '../types/scriptData';
import { toast, ToastOptions } from 'react-toastify';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { now } from 'lodash';

// Custom Secure Storage Utility
class SecureStorage {
  private static instance: SecureStorage;
  private storage: Map<string, any> = new Map();
  private encryptionKey: string = 'youtubeclipsearcher_secure_key_2024';

  private constructor() {
    // Initialize from localStorage if available
    this.loadFromLocalStorage();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // Simple base64 encoding for demonstration (in production, use proper encryption)
      return btoa(unescape(encodeURIComponent(jsonString)));
    } catch (error) {
      console.error('Encryption failed:', error);
      return '';
    }
  }

  private decrypt(encryptedData: string): any {
    try {
      // Simple base64 decoding for demonstration (in production, use proper decryption)
      const jsonString = decodeURIComponent(escape(atob(encryptedData)));
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          const encryptedValue = localStorage.getItem(key);
          if (encryptedValue) {
            const decryptedValue = this.decrypt(encryptedValue);
            if (decryptedValue !== null) {
              const actualKey = key.replace('secure_', '');
              this.storage.set(actualKey, decryptedValue);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      this.storage.forEach((value, key) => {
        const encryptedValue = this.encrypt(value);
        localStorage.setItem(`secure_${key}`, encryptedValue);
      });
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  setItem(key: string, value: any): void {
    this.storage.set(key, value);
    this.saveToLocalStorage();
  }

  getItem(key: string): any {
    return this.storage.get(key);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
    try {
      localStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  clear(): void {
    this.storage.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

// Define types for the secure storage interface
interface SecureStorageItem {
  get: () => any;
  set: (value: any) => void;
  remove: () => void;
}

interface SecureJ {
  [key: string]: SecureStorageItem;
}

interface Secure {
  j: SecureJ;
}

// Create a proxy to provide the @secure.j.approvedScript interface
export const secure: Secure = new Proxy({} as Secure, {
  get(target, prop) {
    if (prop === 'j') {
      return new Proxy({} as SecureJ, {
        get(target, subProp) {
          const storage = SecureStorage.getInstance();
          return {
            get: () => storage.getItem(subProp as string),
            set: (value: any) => storage.setItem(subProp as string, value),
            remove: () => storage.removeItem(subProp as string)
          };
        }
      });
    }
    return undefined;
  }
});

// Helper functions for common secure storage operations
export const SecureStorageHelpers = {
  /**
   * Get approved script from secure storage
   */
  getApprovedScript: () => secure.j.approvedScript.get(),

  /**
   * Set approved script in secure storage
   */
  setApprovedScript: (scriptData: any) => {
    secure.j.approvedScript.set(scriptData);
  },

  /**
   * Remove approved script from secure storage
   */
  removeApprovedScript: () => secure.j.approvedScript.remove(),

  /**
   * Get script metadata from secure storage
   */
  getScriptMetadata: () => secure.j.scriptMetadata.get(),

  /**
   * Set script metadata in secure storage
   */
  setScriptMetadata: (metadata: any) => secure.j.scriptMetadata.set(metadata),

  /**
   * Remove script metadata from secure storage
   */
  removeScriptMetadata: () => secure.j.scriptMetadata.remove()
};

export const cn = (...classes: Array<string | false | null | undefined>): string => {
  return classes.filter(Boolean).join(' ');
};

export class GoogleDriveHelperFunctions {
  /**
    * Update a single scene JSON on the server/Drive and ensure assets are synced.
    * Returns true on success.
    */
  static async updateSceneDataceneOnDrive(jobName: string, jobId: string, sceneId: string, sceneData: SceneData): Promise<boolean> {
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
          const jobFolderName = SceneDataWithAssets.jobName || jobName || `job-${HelperFunctions.generateRandomId()}`;
          const uploadResult = await GoogleDriveHelperFunctions.uploadMediaToDrive(jobFolderName, `${sceneId}/videos`, await HelperFunctions.fetchBlobAsFile(clipUrl, ve?.clip?.name || 'clip.mp4'));
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
        previewImage: SceneDataWithAssets.previewImage || '',
      };
      console.log('Updating scene on Drive:', scene);

      const form = new FormData();
      // Pass job folder and scene folder separately so backend can resolve path as jobs/<folderName>/<sceneFolderId>/
      form.append('jobName', jobName);
      form.append('jobId', jobId);
      form.append('sceneId', sceneId);
      form.append('fileName', 'scene-config.json');
      form.append('jsonData', JSON.stringify(scene));

      const res = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_SCENE_UPLOAD, {
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
  }

  /**
   * Upload a media file (e.g., chroma key or any video) to Google Drive under the given job folder and target subfolder.
   * Returns Drive identifiers on success.
   */
  static async uploadMediaToDrive(jobId: string, targetFolder: string, file: File): Promise<{ success: boolean; projectFolderId?: string; targetFolderId?: string; fileId?: string; fileName?: string; webViewLink?: string; }> {
    try {
      const form = new FormData();
      form.append('jobName', jobId);
      form.append('targetFolder', targetFolder || 'input');
      form.append('file', file);

      const res = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_MEDIA_UPLOAD, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.details || 'Media upload failed');
      }
      return data;
    } catch (e: any) {
      console.error('uploadMediaToDrive error', e);
      return { success: false };
    }
  }

  static async uploadContentToDrive(form: FormData): Promise<{ success: boolean; result: any }> {
    try {
      const response = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_UPLOAD, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, result: err?.error || err?.details || 'Failed to upload to Google Drive' };
      }

      const result = await response.json();
      console.log('Drive result:', result);
      return { success: true, result: result };
    } catch (e: any) {
      console.error('uploadContentToDrive error', e);
      return { success: false, result: e?.message || 'Unknown error' };
    }
  }

  static async generateAFolderOnDrive(jobId: string): Promise<{ success: boolean; result: { folderId: string; webViewLink: string } | null; message?: string }> {
    try {
      const form = new FormData();
      form.append('jobName', jobId);
      const res = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_GENERATE_FOLDER, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || data?.details || 'Failed to generate a folder on Drive');
      }

      // Handle the API response structure: { success: boolean, result: {...}, message: string }
      if (data.success && data.result) {
        return { success: true, result: data.result, message: data.message };
      } else {
        return { success: false, result: null, message: data.message || 'Failed to generate folder' };
      }
    } catch (e: any) {
      console.error('generateAFolderOnDrive error', e);
      return { success: false, result: null, message: e?.message || 'Unknown error' };
    }
  }

  static async generateSceneFoldersInDrive(jobId: string, numberOfScenes: number): Promise<{ success: boolean; result: { folderId: string; webViewLink: string } | null; message?: string }> {
    try {
      const form = new FormData();
      form.append('jobName', jobId);
      form.append('numberOfScenes', numberOfScenes.toString());
      const res = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_GENERATE_SCENE_FOLDERS, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || data?.details || 'Failed to generate scene folders');
      }
      return { success: true, result: data.result, message: data.message };
    } catch (e: any) {
      console.error('generateSceneFoldersInDrive error', e);
      return { success: false, result: null, message: e?.message || 'Unknown error' };
    }
  }
}

export class HelperFunctions {

  static getSearchQuery(selectedLocation: string, selectedLocationType: string, selectedDateRange: string, selectedCountry: string): string {
    const location = selectedLocationType === 'global'
      ? selectedLocationType
      : selectedLocationType === 'region'
        ? selectedLocation
        : (selectedLocation === 'all' ? selectedCountry : (selectedLocation + ', ' + selectedCountry));
    return `${location}|${selectedDateRange}`;
  }

  // Check if all required fields are selected
  static isAllFieldsSelected(selectedLocation: string, selectedLocationType: string, selectedDateRange: string, selectedCountry: string, selectedPreviousLocation: string, selectedPreviousLocationType: string, selectedPreviousDateRange: string, selectedPreviousCountry: string): boolean {
    // require all valid fields filled first
    if (!selectedDateRange) return false;
    if (selectedLocationType === 'global') {
      // for global, just need dateRange
      if (
        selectedLocationType !== selectedPreviousLocationType &&
        selectedDateRange !== selectedPreviousDateRange
      ) {
        return true;
      } else {
        return false;
      }
    } else if (selectedLocationType === 'region') {
      // require region name (selectedLocation)
      if (
        !!selectedLocation &&
        (selectedLocation !== selectedPreviousLocation &&
          selectedLocationType !== selectedPreviousLocationType &&
          selectedDateRange !== selectedPreviousDateRange)
      ) {
        return true;
      } else {
        return false;
      }
    } else if (selectedLocationType === 'country') {
      // require country and location both
      if (
        !!selectedCountry &&
        !!selectedLocation &&
        selectedCountry !== selectedPreviousCountry &&
        selectedLocation !== selectedPreviousLocation &&
        selectedLocationType !== selectedPreviousLocationType &&
        selectedDateRange !== selectedPreviousDateRange
      ) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  };

  static handleDownloadAllNarrations = (scriptData: ScriptData) => {

    try {
      // Build script content in the same structured format used in approval
      let content = '';
      if (scriptData) {
        const parts: string[] = [];
        const headers = HelperFunctions.getLocalizedSectionHeaders(scriptData.language || 'english');
        if (scriptData.title && scriptData.title.trim()) {
          parts.push(`📋 ${headers.title}:\n${scriptData.title.trim()}`);
        }
        if (scriptData.hook && scriptData.hook.trim()) {
          parts.push(`🎯 ${headers.hook}:\n${scriptData.hook.trim()}`);
        }
        if (scriptData.main_content && scriptData.main_content.trim()) {
          parts.push(`📝 ${headers.main_content}:\n${scriptData.main_content.trim()}`);
        }
        if (scriptData.conclusion && scriptData.conclusion.trim()) {
          parts.push(`🏁 ${headers.conclusion}:\n${scriptData.conclusion.trim()}`);
        }
        if (scriptData.call_to_action && scriptData.call_to_action.trim()) {
          parts.push(`🚀 ${headers.call_to_action}:\n${scriptData.call_to_action.trim()}`);
        }
        content = parts.filter(Boolean).join('\n\n');
        if (!content.trim() && scriptData.script) {
          content = scriptData.script;
        }
      }

      if (!content.trim()) {
        toast.error('No script content to download');
        return;
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeTopic = (scriptData?.topic || 'script').toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
      a.href = url;
      a.download = `${safeTopic || 'script'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Script downloaded successfully');
    } catch (error) {
      toast.error('Failed to download narrations');
    }
  };

  /**
   * Parse a narration .txt file and return extracted fields.
   * Recognizes headers like TITLE, HOOK, MAIN CONTENT, CONCLUSION, CALL TO ACTION.
   */
  static async parseNarrationFile(file: File): Promise<Partial<ScriptData>> {
    try {
      const text = await HelperFunctions.readFileAsText(file);
      const normalized = text.replace(/\r\n?/g, '\n');
      const sections = HelperFunctions.extractSections(normalized);

      const title = sections['title'] || '';
      const hook = sections['hook'] || '';
      const main_content = sections['main content'] || sections['main_content'] || '';
      const conclusion = sections['conclusion'] || '';
      const call_to_action = sections['call to action'] || sections['call_to_action'] || '';

      const script = [hook, main_content, conclusion, call_to_action].filter(Boolean).join('\n\n');
      // console.log('script', script);

      return { title, hook, main_content, conclusion, call_to_action, script } as Partial<ScriptData>;
    } catch (e) {
      console.error('parseNarrationFile failed', e);
      HelperFunctions.showError('Failed to parse narration file');
      return {} as Partial<ScriptData>;
    }
  }

  private static readFileAsText(file: File): Promise<string> {
    if (typeof (file as any).text === 'function') {
      return (file as any).text();
    }
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => resolve(String(e.target?.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      } catch (err) {
        reject(err);
      }
    });
  }

  private static extractSections(input: string): Record<string, string> {
    const lines = input.split('\n');
    const sections: Record<string, string> = {};
    let currentKey: string | null = null;
    let buffer: string[] = [];

    const commit = () => {
      if (currentKey !== null) {
        sections[currentKey] = buffer.join('\n').trim();
      }
      buffer = [];
    };

    // Be lenient: allow any leading symbols/emojis, capture ALL-CAPS words before the colon
    const headerRegex = /^\s*[^A-Za-z0-9]*\s*([A-Z][A-Z ]+?)\s*:\s*$/;

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const m = line.match(headerRegex);
      if (m) {
        commit();
        currentKey = m[1].toLowerCase();
        continue;
      }
      buffer.push(rawLine);
    }
    commit();

    const normalized: Record<string, string> = {};
    Object.keys(sections).forEach((k) => {
      const nk = k.replace(/\s+/g, ' ').replace(/_/g, ' ').trim();
      normalized[nk] = sections[k];
    });
    return normalized;
  }

  /**
   * Get saved social auth keys for a user (stored securely in local storage)
   */
  static getSocialAuthKeys(userId: string): { tiktok?: string; instagram?: string; facebook?: string; youtube?: string } {
    try {
      const key = `socialAuthKeys_${userId}`;
      const data = secure.j[key as any].get();
      if (data && typeof data === 'object') {
        return data as any;
      }
    } catch (e) {
      console.warn('getSocialAuthKeys failed', e);
    }
    return {};
  }

  /**
   * Save social auth keys for a user (stored securely in local storage)
   */
  static saveSocialAuthKeys(userId: string, keys: { tiktok?: string; instagram?: string; facebook?: string; youtube?: string }): void {
    try {
      const key = `socialAuthKeys_${userId}`;
      secure.j[key as any].set({
        tiktok: keys.tiktok || '',
        instagram: keys.instagram || '',
        facebook: keys.facebook || '',
        youtube: keys.youtube || ''
      });
      HelperFunctions.showSuccess('Social auth keys saved');
    } catch (e) {
      console.error('saveSocialAuthKeys failed', e);
      HelperFunctions.showError('Failed to save social auth keys');
    }
  }
  /**
   * Show success toast notification
   */
  static showSuccess(message: string, options?: ToastOptions): void {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Merge a SceneData's assets with any media referenced in keywordsSelected.
   * Ensures assets.images includes low/high media URLs without duplicates.
   */
  static ensureAssetsContainKeywordMedia(sceneData: SceneData): SceneData {
    const existingImages = Array.isArray(sceneData.assets?.images) ? (sceneData.assets!.images as string[]) : [];
    const keywordImages = HelperFunctions.extractImageUrlsFromKeywordsSelected((sceneData as any).keywordsSelected);
    const merged = Array.from(new Set([...(existingImages || []), ...keywordImages].filter(Boolean)));
    return {
      ...sceneData,
      assets: {
        ...(sceneData.assets || {} as any),
        images: merged
      } as any
    } as SceneData;
  }

  // Utility: fetch a URL or blob: URL as a File for upload
  static async fetchBlobAsFile(url: string, fileName: string): Promise<File> {
    const res = await fetch(url);
    const blob = await res.blob();
    // Preserve basic type if available
    const type = (blob as any).type || (fileName.endsWith('.mp4') ? 'video/mp4' : undefined);
    return new File([blob], fileName, { type });
  }

  /**
   * Persist a SceneData scene change to Drive and show toast feedback
   */
  static async persistSceneUpdate(
    jobId: string,
    scenesData: SceneData[],
    SceneDataIndex: number,
    successMessage: string = 'Scene updated on Drive'
  ): Promise<void> {
    try {
      const sceneData = scenesData?.[SceneDataIndex];
      if (!sceneData) return;
      const sceneId = String((sceneData as any).id || '');
      const job_id = String((sceneData as any).jobId || jobId || '');
      // const jobName = String((SceneData as any).jobName || jobInfo?.jobName || '');
      if (!jobId || !sceneId) return;
      const ok = await GoogleDriveHelperFunctions.updateSceneDataceneOnDrive(job_id, job_id, sceneId, sceneData);
      if (ok) {
        HelperFunctions.showSuccess(successMessage);
      } else {
        HelperFunctions.showError('Failed to update scene on Drive');
      }
    } catch (e) {
      console.error('persistSceneUpdate error', e);
      HelperFunctions.showError('Failed to update scene on Drive');
    }
  }

  /**
   * Show error toast notification
   */
  static showError(message: string, options?: ToastOptions): void {
    toast.error(message, {
      position: "top-right",
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Show warning toast notification
   */
  static showWarning(message: string, options?: ToastOptions): void {
    toast.warning(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Show info toast notification
   */
  static showInfo(message: string, options?: ToastOptions): void {
    toast.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  /**
   * Show loading toast notification
   */
  static showLoading(message: string, options?: ToastOptions): string {
    return toast.loading(message, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      ...options
    }) as string;
  }

  /**
   * Update existing toast notification
   */
  static updateToast(toastId: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      autoClose: 5000,
    });
  }

  /**
   * Dismiss toast notification
   */
  static dismissToast(toastId?: string): void {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  /**
   * Format tweet volume numbers to human-readable format
   */
  static formatTweetVolume(volume: number): string {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  /**
   * Get trending color based on ranking index
   */
  static getTrendingColor(index: number): string {
    if (index === 0) return '#FFD700'; // Gold for #1
    if (index === 1) return '#C0C0C0'; // Silver for #2
    if (index === 2) return '#CD7F32'; // Bronze for #3
    return '#1DA1F2'; // Blue for others
  }

  /**
   * Clear all secure storage entries and any app-local cached data.
   * Intended to be called on user sign out to reset to first screen.
   */
  static clearSecureStorage(): void {
    try {
      const storage = (SecureStorage as any).getInstance() as SecureStorage;
      storage.clear();
    } catch (e) {
      // Fallback: clear secure_* keys directly from localStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((k) => {
          if (k.startsWith('secure_')) localStorage.removeItem(k);
        });
      } catch { }
    }
  }

  /**
   * Add a new SceneData after a specific index
   */
  static addSceneDataAfter(
    index: number,
    sceneData: SceneData[],
    setSceneData: (sceneData: SceneData[]) => void
  ): void {
    const newSceneData: SceneData = {
      id: Date.now().toString(),
      narration: '',
      duration: '',
      words: 0,
      startTime: 0,
      endTime: 0,
      durationInSeconds: 0,
      assets: {
        images: null,
      }
    }

    const updatedSceneData = [...sceneData];
    updatedSceneData.splice(index + 1, 0, newSceneData);
    setSceneData(updatedSceneData);
  }

  /**
   * Delete a SceneData at a specific index
   */
  static deleteSceneData(
    index: number,
    sceneData: SceneData[],
    setSceneData: (sceneData: SceneData[]) => void
  ): void {
    const updatedSceneData = sceneData.filter((_, i) => i !== index);
    setSceneData(updatedSceneData);
  }

  /**
   * Save edited SceneData
   */
  static saveEdit(
    index: number,
    sceneData: SceneData[],
    setSceneData: (sceneData: SceneData[]) => void,
    editHeading: string,
    editNarration: string,
    setEditingSceneData: (index: number | null) => void
  ): void {
    const updatedSceneData = [...sceneData];

    updatedSceneData[index] = {
      ...updatedSceneData[index],
      // update the model change here as well
      duration: updatedSceneData[index].duration,
      assets: updatedSceneData[index].assets,
    };
    setSceneData(updatedSceneData);
    setEditingSceneData(null);
  }

  /**
   * Cancel SceneData editing
   */
  static cancelEdit(
    setEditingSceneData: (index: number | null) => void,
    setEditHeading: (heading: string) => void,
    setEditNarration: (narration: string) => void
  ): void {
    setEditingSceneData(null);
    setEditHeading('');
    setEditNarration('');
  }

  /**
   * Download image as file
   */
  static downloadImage(src: string, index: number): void {
    const a = document.createElement('a');
    a.href = src;
    a.download = `image-${index + 1}.png`;
    a.click();
  }

  /**
   * Trigger file upload input click
   */
  static triggerFileUpload(): void {
    const el = document.getElementById('upload-input');
    el?.click();
  }

  /**
   * Calculate estimated duration based on script content (average reading speed: 150-160 words per minute)
   */
  static calculateDuration(script: string): string {
    if (!script?.trim()) return '0';

    const words = script?.trim().split(/\s+/).length;
    const averageWordsPerMinute = 155; // Average speaking/reading speed
    const minutes = words / averageWordsPerMinute;

    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    } else if (minutes < 60) {
      const wholeMinutes = Math.floor(minutes);
      const seconds = Math.round((minutes - wholeMinutes) * 60);
      return seconds > 0 ? `${wholeMinutes}m ${seconds}s` : `${wholeMinutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Returns appropriate font-family stack based on language
   * - Urdu: Noto Nastaliq Urdu
   * - Arabic: Noto Naskh Arabic
   * - Default (LTR): Inter/Roboto stack
   */
  static getFontFamilyForLanguage(language: string): string {
    const lang = (language || '').toLowerCase();
    if (lang.includes('urdu') || lang.includes('balochi') || lang.includes('punjabi')) {
      return `'Noto Nastaliq Urdu', 'Arial Unicode MS', sans-serif`;
    }
    if (lang.includes('arabic')) {
      return `'Noto Naskh Arabic', 'Arial Unicode MS', sans-serif`;
    }
    return `var(--font-plus-jakarta-sans)`;
  }

  /**
   * Returns true if the language is RTL (right-to-left)
   */
  static isRTLLanguage(language: string): boolean {
    const rtlLanguages = ['urdu', 'arabic', 'persian', 'sindhi', 'pashto', 'balochi', 'hebrew'];
    return rtlLanguages.includes((language || '').toLowerCase());
  }

  /**
   * Returns MUI sx direction styles for a given language
   */
  static getDirectionSx(language: string) {
    const isRTL = HelperFunctions.isRTLLanguage(language);
    const direction = isRTL ? 'rtl' : 'ltr';
    return {
      direction,
      textAlign: isRTL ? 'right' : 'left',
      '& *': {
        direction,
        textAlign: isRTL ? 'right' : 'left'
      }
    } as const;
  }

  static detectLanguage(text: string): 'urdu' | 'english' | 'mixed' | 'unknown' {
    const urduRegex = /[\u0600-\u06FF]/;
    const englishRegex = /[A-Za-z]/;

    const hasUrdu = urduRegex.test(text);
    const hasEnglish = englishRegex.test(text);

    if (hasUrdu && !hasEnglish) return 'urdu';
    if (hasEnglish && !hasUrdu) return 'english';
    if (hasUrdu && hasEnglish) return 'mixed';
    return 'unknown';
  }

  static getTimeRangeDescription(dateRange: string): string {
    switch (dateRange) {
      case '24h':
        return 'past 24 hours';
      case '7d':
        return 'past week';

      case '30d':
        return 'past month';
      case 'anytime':
        return 'any time period';
      default:
        return 'past 24 hours';
    }
  }

  static generateRandomId(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }


  /**
   * Generate unique job ID
   */
  static generateJobId(): string {
    const now = new Date();
    return `job-${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`;
  }


  /**
   * Extract image URLs from a SceneData's keywordsSelected map.
   * Accepts shapes like: { keyword: ["https://...", "..."], other: "https://..." }
   */
  static extractImageUrlsFromKeywordsSelected(keywordsSelected: unknown): string[] {
    if (!keywordsSelected) return [];

    const urls: string[] = [];
    // New array format
    if (Array.isArray(keywordsSelected)) {
      for (const entry of keywordsSelected as any[]) {
        const media = entry?.media;
        if (media) {
          const low = media.lowResMedia;
          const high = media.highResMedia;
          if (typeof low === 'string' && /^https?:\/\//i.test(low)) urls.push(low);
          if (typeof high === 'string' && /^https?:\/\//i.test(high)) urls.push(high);
        }
      }
    } else if (typeof keywordsSelected === 'object') {
      // Legacy map format
      for (const value of Object.values(keywordsSelected as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
              urls.push(v);
            }
          }
        } else if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
          urls.push(value);
        }
      }
    }
    // de-duplicate while preserving order
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const u of urls) {
      if (!seen.has(u)) {
        seen.add(u);
        deduped.push(u);
      }
    }
    return deduped;
  }

  // Function to get localized section headers based on language
  static getLocalizedSectionHeaders = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'urdu':
        return {
          title: 'عنوان',
          hook: 'ہک',
          main_content: 'اہم مواد',
          conclusion: 'نتیجہ',
          call_to_action: 'کارروائی کا مطالبہ'
        };
      case 'arabic':
        return {
          title: 'عنوان',
          hook: 'خطاب',
          main_content: 'المحتوى الرئيسي',
          conclusion: 'خاتمة',
          call_to_action: 'دعوة للعمل'
        };
      case 'hindi':
        return {
          title: 'शीर्षक',
          hook: 'हुक',
          main_content: 'मुख्य सामग्री',
          conclusion: 'निष्कर्ष',
          call_to_action: 'कार्रवाई का आह्वान'
        };
      default: // english and other languages
        return {
          title: 'TITLE',
          hook: 'HOOK',
          main_content: 'MAIN CONTENT',
          conclusion: 'CONCLUSION',
          call_to_action: 'CALL TO ACTION'
        };
    }
  };

  /**
   * Call Gemini endpoint to get highlighted keywords for SceneData and merge into SceneData array
   */
  static async fetchAndApplyHighlightedKeywords(
    scenesData: SceneData[],
    setSceneData: (scenesData: SceneData[]) => void,
    SceneDataUpdated: (scenesData: SceneData[]) => void
  ): Promise<void> {
    let bestSceneData: SceneData[] = scenesData;
    try {
      const payload = scenesData.map(c => ({ id: c.id, narration: c.narration }));
      const res = await fetch(API_ENDPOINTS.GEMINI_HIGHLIGHT_KEYWORDS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenesData: payload })
      });
      if (!res.ok) {
        HelperFunctions.fetchAndApplyHighlightedKeywords(scenesData, setSceneData, SceneDataUpdated);
        return;
      }
      const data = await res.json();
      const map: Record<string, string[]> = {};
      if (Array.isArray(data?.results)) {
        for (const r of data.results) {
          const id = String(r?.id ?? '');
          const kws = Array.isArray(r?.highlightedKeywords) ? r.highlightedKeywords.filter((x: any) => typeof x === 'string' && x.trim()) : [];
          if (id) map[id] = kws;
        }
      }
      const updated = scenesData.map(ch => ({
        ...ch,
        highlightedKeywords: map[ch.id] && map[ch.id].length > 0 ? map[ch.id] : (ch.highlightedKeywords || [])
      }));
      setSceneData(updated);
      bestSceneData = updated;
    } catch (e) {
      console.error('highlight extraction failed', e);
      HelperFunctions.showError(e instanceof Error ? e.message : 'Failed to extract highlighted keywords');
    } finally {
      // Ensure callback is invoked even on failure, with best available SceneData
      try {
        SceneDataUpdated(bestSceneData);
      } catch { }
    }
  }
}

