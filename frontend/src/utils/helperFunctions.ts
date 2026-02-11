import { SceneData } from '../types/sceneData';
import { LogoOverlayInterface, ScriptData, SettingItemInterface, Settings } from '../types/scriptData';
import { toast, ToastOptions } from 'react-toastify';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { BACKGROUNDS_CACHE_MAX_AGE_LOCAL, SCRIPT_STATUS } from '@/data/constants';
import { MediaFile, MediaType, ProjectState } from '@/types/video_editor';

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
      console.log('Encryption failed:', error);
      return '';
    }
  }

  private decrypt(encryptedData: string): any {
    try {
      // Simple base64 decoding for demonstration (in production, use proper decryption)
      const jsonString = decodeURIComponent(escape(atob(encryptedData)));
      return JSON.parse(jsonString);
    } catch (error) {
      console.log('Decryption failed:', error);
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
      console.log('Failed to load from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      this.storage.forEach((value, key) => {
        const encryptedValue = this.encrypt(value);
        localStorage.setItem(`secure_${key}`, encryptedValue);
      });
    } catch (error) {
      console.log('Failed to save to localStorage:', error);
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
      console.log('Failed to remove from localStorage:', error);
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
      console.log('Failed to clear localStorage:', error);
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

export class HelperFunctions {
  static getValidNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const numericValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return Number.isFinite(numericValue) ? Number(numericValue) : null;
  }

  static getAspectRatio(width: number, height: number): string {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return '16:9';
    }
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
  }

  static parseResolution(resolution?: string): { width: number; height: number } {
    if (!resolution || typeof resolution !== 'string') {
      return { width: 1920, height: 1080 };
    }
    const [widthStr, heightStr] = resolution.split('x');
    const width = HelperFunctions.getValidNumber(widthStr) || 1920;
    const height = HelperFunctions.getValidNumber(heightStr) || 1080;
    return { width, height };
  }

  static getFileNameFromUrl(url: string, fallback: string): string {
    if (!url) return fallback;
    try {
      const parsed = new URL(url);
      const name = parsed.pathname.split('/').filter(Boolean).pop() || '';
      return name || fallback;
    } catch {
      const parts = url.split('?')[0].split('/').filter(Boolean);
      const name = parts[parts.length - 1] || '';
      return name || fallback;
    }
  }

  static getScenesFromScriptMetadata(scriptMetadata: any): SceneData[] {
    if (Array.isArray(scriptMetadata?.script)) {
      return scriptMetadata.script as SceneData[];
    }
    if (Array.isArray(scriptMetadata?.scenesData)) {
      return scriptMetadata.scenesData as SceneData[];
    }
    if (Array.isArray(scriptMetadata?.project?.scenesData)) {
      return scriptMetadata.project.scenesData as SceneData[];
    }
    if (Array.isArray(scriptMetadata?.project?.script)) {
      return scriptMetadata.project.script as SceneData[];
    }
    return [];
  }

  static getMediaFilesFromScriptMetadata(scriptMetadata: any, resolution: { width: number; height: number }): MediaFile[] {
    const scenes = HelperFunctions.getScenesFromScriptMetadata(scriptMetadata);
    const mediaFiles: MediaFile[] = [];
    let zIndex = 0;

    scenes.forEach((scene, sceneIndex) => {
      const usedUrls = new Set<string>();
      const sceneStart = HelperFunctions.getValidNumber(scene.startTime) ?? 0;
      const sceneEnd = HelperFunctions.getValidNumber(scene.endTime);
      const durationInSeconds = HelperFunctions.getValidNumber(scene.durationInSeconds) ?? 0;
      const sceneDuration = sceneEnd && sceneEnd > sceneStart ? sceneEnd - sceneStart : (durationInSeconds || 4);
      const positionStart = sceneStart;
      const positionEnd = sceneStart + sceneDuration;

      const previewImage = (scene as any)?.gammaPreviewImage || (scene as any)?.previewImage || '';
      const imageUrls = [
        ...(Array.isArray(scene.assets?.images) ? scene.assets!.images!.filter(Boolean) as string[] : []),
        previewImage
      ].filter(Boolean);

      // const previewClip = (scene as any)?.localPath || '';
      // const previewClip = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      const previewClip = (scene as any)?.previewClip || '';
      const assetClips = Array.isArray(scene.assets?.clips) ? scene.assets!.clips! : [];
      const localAssetClips = assetClips
        .map((clip: any) => clip?.url)
        .filter((url: string | undefined) => {
          if (!url) return false;
          return /^[A-Za-z]:[\\/]/.test(url) || url.startsWith('/');
        });
      const clipUrls = [
        ...localAssetClips,
        previewClip
      ]
      // .filter((url) => {
      //   if (!url) return false;
      //   return /^[A-Za-z]:[\\/]/.test(url) || url.startsWith('/');
      // });

      imageUrls.forEach((url, imageIndex) => {
        if (usedUrls.has(url)) return;
        usedUrls.add(url);
        const id = crypto.randomUUID();
        const normalizedUrl = HelperFunctions.normalizeGoogleDriveUrl(url);
        mediaFiles.push({
          id,
          fileName: `Image-${sceneIndex + 1}-${imageIndex + 1}`,
          fileId: id,
          type: 'image',
          startTime: 0,
          endTime: 3,
          src: normalizedUrl,
          positionStart,
          positionEnd,
          includeInMerge: true,
          playbackSpeed: 1,
          volume: 100,
          zIndex: zIndex++,
          x: 0,
          y: 0,
          width: resolution.width,
          height: resolution.height,
          rotation: 0,
          opacity: 100,
          crop: { x: 0, y: 0, width: resolution.width, height: resolution.height }
        });
      });

      clipUrls.forEach((url, clipIndex) => {
        if (usedUrls.has(url)) return;
        usedUrls.add(url);
        const id = crypto.randomUUID();
        const normalizedUrl = HelperFunctions.getClipUrl(url) || url;
        mediaFiles.push({
          id,
          fileName: `Video-${sceneIndex + 1}-${clipIndex + 1}`,
          fileId: id,
          type: 'video',
          startTime: 0,
          endTime: sceneDuration,
          src: normalizedUrl,
          positionStart,
          positionEnd,
          includeInMerge: true,
          playbackSpeed: 1,
          volume: 100,
          zIndex: zIndex++,
          x: 0,
          y: 0,
          width: resolution.width,
          height: resolution.height,
          rotation: 0,
          opacity: 100,
          crop: { x: 0, y: 0, width: resolution.width, height: resolution.height }
        });
      });
    });

    return mediaFiles;
  }

  static createProjectFromScriptMetadata(projectId: string, scriptMetadata: any): ProjectState | null {
    if (!projectId || !scriptMetadata) return null;
    const projectData = scriptMetadata?.project && typeof scriptMetadata.project === 'object' ? scriptMetadata.project : scriptMetadata;
    const resolution = HelperFunctions.parseResolution(projectData?.resolution);
    const scenes = HelperFunctions.getScenesFromScriptMetadata(scriptMetadata);
    const mediaFiles = HelperFunctions.getMediaFilesFromScriptMetadata(scriptMetadata, resolution);
    const sceneEndTimes = scenes
      .map(scene => {
        const start = HelperFunctions.getValidNumber(scene.startTime) ?? 0;
        const end = HelperFunctions.getValidNumber(scene.endTime);
        if (end && end > start) return end;
        const duration = HelperFunctions.getValidNumber(scene.durationInSeconds) ?? 0;
        return start + duration;
      })
      .filter(value => Number.isFinite(value)) as number[];
    const maxSceneEnd = sceneEndTimes.length > 0 ? Math.max(...sceneEndTimes) : 0;
    const projectDuration = HelperFunctions.getValidNumber(projectData?.videoDuration) ?? 0;
    const duration = Math.max(projectDuration, maxSceneEnd);
    const projectName = projectData?.title || scriptMetadata?.title || 'Untitled Project';

    return {
      id: projectId,
      projectName,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      mediaFiles,
      textElements: [],
      currentTime: 0,
      isPlaying: false,
      isMuted: false,
      duration,
      activeSection: 'media',
      activeElement: 'text',
      activeElementIndex: 0,
      filesID: [],
      zoomLevel: 1,
      timelineZoom: 100,
      enableMarkerTracking: true,
      resolution: { width: resolution.width, height: resolution.height },
      fps: 30,
      aspectRatio: HelperFunctions.getAspectRatio(resolution.width, resolution.height),
      history: [],
      future: [],
      autoRenderRequested: true,
      autoRenderProjectId: '',
      exportSettings: {
        resolution: '480p',
        quality: 'low',
        speed: 'fastest',
        fps: 30,
        format: 'mp4',
        includeSubtitles: false
      }
    };
  }

  static convertProjectJSONToScriptData(projectJson: any): ScriptData {
    // Handle both old nested structure (projectJson.project) and new flat structure
    const projectData = projectJson.project || projectJson;

    return {
      ...projectData,
      jobName: projectData.jobId || '',
      status: SCRIPT_STATUS.UPLOADED,
      isScriptDownloaded: true,
      // Handle scenesData from flat structure or script from nested structure
      scenesData: projectJson.scenesData || projectJson.script || [],
    };
  }

  static getProjectJSON(userId: string, jobId: string, scriptData: ScriptData, projectSettings: Settings, scenesData: SceneData[], userEmail?: string): any {
    return {
      project: {
        userId: userId,
        userEmail: userEmail,
        jobId: scriptData?.jobId || '',
        topic: scriptData?.topic || null,
        title: scriptData?.title || null,
        description: scriptData?.description || null,
        duration: parseInt(scriptData?.duration || '1') || null,
        resolution: '1920x1080',
        region: scriptData?.region || null,
        language: scriptData?.language || null,
        subtitle_language: scriptData?.subtitle_language || null,
        narration_type: scriptData?.narration_type || null,
        narrator_chroma_key_link: scriptData?.narrator_chroma_key_link,
        transcription: scriptData?.transcription || '',
        // Project-level settings
        projectSettings: (() => {
          // Determine backgroundType: use explicit value if set, otherwise infer from videoBackgroundImage
          const projectBackgroundType = projectSettings?.backgroundType
            ? projectSettings.backgroundType
            : (projectSettings?.videoBackgroundImage ? 'image' : 'video');

          return {
            videoLogo: projectSettings?.videoLogo as LogoOverlayInterface,
            videoBackgroundMusic: projectSettings?.videoBackgroundMusic as SettingItemInterface,
            videoBackgroundVideo: projectSettings?.videoBackgroundVideo as SettingItemInterface,
            videoBackgroundImage: projectSettings?.videoBackgroundImage as SettingItemInterface,
            backgroundType: projectBackgroundType,
            videoTransitionEffect: projectSettings?.videoTransitionEffect as SettingItemInterface,
            showPreviewImageAtStart: projectSettings?.showPreviewImageAtStart,
          };
        })(),
      },
      // Use SceneDataForUpload to ensure merged images are included
      script: scenesData.map(sceneData => ({
        jobId: jobId,
        id: sceneData.id,
        narration: sceneData.narration,
        duration: sceneData.duration,
        durationInSeconds: sceneData.durationInSeconds,
        words: sceneData.words,
        startTime: sceneData.startTime,
        endTime: sceneData.endTime,
        highlightedKeywords: sceneData.highlightedKeywords || [],
        keywordsSelected: Array.isArray(sceneData.keywordsSelected) ? sceneData.keywordsSelected : [],
        assets: {
          images: Array.isArray(sceneData.assets?.images)
            ? sceneData?.assets?.images?.filter(img => !HelperFunctions.isBase64Image(img))
            : [],
          clips: sceneData?.assets?.clips || [],
        },
        gammaGenId: sceneData?.gammaGenId || '',
        gammaUrl: sceneData?.gammaUrl || '',
        previewImage: HelperFunctions.sanitizePreviewImage(sceneData?.gammaPreviewImage),
        previewClip: sceneData?.previewClip || '',
        sceneSettings: {
          videoLogo: sceneData.sceneSettings?.videoLogo as LogoOverlayInterface,
          videoTransitionEffect: sceneData.sceneSettings?.videoTransitionEffect as SettingItemInterface,
          videoBackgroundMusic: sceneData.sceneSettings?.videoBackgroundMusic as SettingItemInterface,
          videoBackgroundVideo: sceneData.sceneSettings?.videoBackgroundVideo as SettingItemInterface,
          videoBackgroundImage: sceneData.sceneSettings?.videoBackgroundImage as SettingItemInterface,
          backgroundType: sceneData.sceneSettings?.backgroundType || (sceneData.sceneSettings?.videoBackgroundImage ? 'image' : 'video'),
          showPreviewImageAtStart: sceneData.sceneSettings?.showPreviewImageAtStart,
        },
      })),
    };
  }

  static getBackgroundsCacheMaxAge(): number {
    if (process.env.BACKGROUNDS_CACHE_MAX_AGE) {
      const parsed = parseInt(process.env.BACKGROUNDS_CACHE_MAX_AGE, 10);
      return Number.isNaN(parsed) ? BACKGROUNDS_CACHE_MAX_AGE_LOCAL : parsed;
    }
    return BACKGROUNDS_CACHE_MAX_AGE_LOCAL;
  }

  static getCacheKey(searchQuery: string, selectedDateRange: string): string {
    return `trending_topics_${searchQuery}_${selectedDateRange}`;
  }

  static getSearchQuery(selectedLocation: string, selectedLocationType: string, selectedCountry: string): string {
    const location = selectedLocationType === 'global'
      ? selectedLocationType
      : selectedLocationType === 'region'
        ? selectedLocation
        : (selectedLocation === 'all' ? selectedCountry : (selectedLocation + ', ' + selectedCountry));
    console.log(`${location}`);
    return `${location}`;
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

  static getProgressMessage = (currentStep: string) => {
    switch (currentStep) {
      case 'compressing':
        return 'Compressing video. Please wait...';
      case 'uploading':
        return 'Uploading video to Google Drive. Please wait...';
      case 'videoConversion':
        return 'Converting video to audio. Please wait...';
      case 'transcribing':
        return 'Transcribing audio to text. Please wait...';
      case 'llmProcessing':
        return 'Processing with LLM. Please wait...';
      case 'segmentation':
        return 'Segmenting video. Please wait...';
      case 'completed':
        return 'All done! Your video has been processed successfully.';
      default:
        return 'Processing...';
    }
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
      console.log('parseNarrationFile failed', e);
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
        clips: null,
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
   * Returns appropriate font-family stack based on language
   * - Urdu: Noto Nastaliq Urdu
   * - Arabic: Noto Naskh Arabic
   * - Default (LTR): Inter/Roboto stack
   */
  static getFontFamilyForLanguage(language: string): string {
    const lang = (language || '').toLowerCase();
    if (lang.includes('urdu') || lang.includes('balochi') || lang.includes('punjabi')) {
      return `Noto Nastaliq Urdu`;
    }
    if (lang.includes('arabic')) {
      return `Noto Naskh Arabic`;
    }
    return `Plus Jakarta Sans`;
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
      if (!seen.has(u) && !HelperFunctions.isVideoUrl(u)) {
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
        if (res.status === 429 || res.status === 500) {
          HelperFunctions.showError(`${res.statusText}. Please try again later.`);
        } else {
          HelperFunctions.fetchAndApplyHighlightedKeywords(scenesData, setSceneData, SceneDataUpdated);
        }
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
      console.log('highlight extraction failed', e);
      HelperFunctions.showError(e instanceof Error ? e.message : 'Failed to extract highlighted keywords');
    } finally {
      // Ensure callback is invoked even on failure, with best available SceneData
      try {
        SceneDataUpdated(bestSceneData);
      } catch { }
    }
  }

  static extractVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
      video.src = url;
    });
  };

  static extractMediaDuration = (file: File, mediaType: MediaType): Promise<number> => {
    if (mediaType === 'image') {
      return Promise.resolve(4);
    }
    return new Promise((resolve) => {
      const element = document.createElement(mediaType === 'audio' ? 'audio' : 'video');
      const url = URL.createObjectURL(file);
      element.preload = 'metadata';
      element.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(element.duration);
      };
      element.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(4);
      };
      element.src = url;
    });
  };

  static formatTimeWithHours(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${secs > 0 ? `${secs}s` : ''}`;
  }

  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Extract file ID from various Google Drive URL formats
   * Returns the file ID or null if not found
   */
  static extractGoogleDriveFileId(inputUrl: string): string | null {
    try {
      if (!inputUrl || typeof inputUrl !== 'string') return null;

      // Only process drive.google.com links
      if (!inputUrl.includes('drive.google.com')) {
        return null;
      }

      // If already in uc?id= format, extract the ID
      const ucMatch = inputUrl.match(/[?&]id=([A-Za-z0-9_-]+)/);
      if (ucMatch && ucMatch[1]) {
        return ucMatch[1];
      }

      const url = new URL(inputUrl);

      // Pattern: /file/d/<id>/view or /file/d/<id> or /file/d/<id>/...
      const fileDMatch = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
      if (fileDMatch && fileDMatch[1]) {
        return fileDMatch[1];
      }

      // Pattern: /open?id=<id>  or any query with id
      const idParam = url.searchParams.get('id');
      if (idParam) {
        return idParam;
      }

      // Try to extract ID from the path if it looks like a file ID
      const pathParts = url.pathname.split('/');
      const fileIndex = pathParts.indexOf('d');
      if (fileIndex !== -1 && pathParts[fileIndex + 1]) {
        const potentialId = pathParts[fileIndex + 1];
        // Validate it looks like a Google Drive file ID (alphanumeric, dashes, underscores)
        if (/^[A-Za-z0-9_-]+$/.test(potentialId) && potentialId.length > 10) {
          return potentialId;
        }
      }

      return null;
    } catch (e) {
      console.warn('Failed to extract Google Drive file ID:', inputUrl, e);
      return null;
    }
  }

  static normalizeGoogleDriveUrl(inputUrl: string): string {
    try {
      if (!inputUrl || typeof inputUrl !== 'string') return inputUrl;

      // Extract file ID from the URL
      const fileId = HelperFunctions.extractGoogleDriveFileId(inputUrl);

      if (fileId) {
        return `${API_ENDPOINTS.GOOGLE_DRIVE_MEDIA_BASE}?id=${encodeURIComponent(fileId)}`;
      }

      // If it's not a Google Drive URL or we couldn't extract the ID, return as-is
      return inputUrl;
    } catch (e) {
      console.warn('Failed to normalize Google Drive URL:', inputUrl, e);
      return inputUrl;
    }
  }

  static isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
    const isEnvatoVideo = lowerUrl.includes('envatousercontent.com') && lowerUrl.includes('watermarked_preview');
    const isVideoPath = lowerUrl.includes('/video/') || lowerUrl.includes('video-previews');
    return hasVideoExtension || isEnvatoVideo || isVideoPath;
  };

  /**
   * Validate and normalize image URLs for all sources (Google, Envato, etc.)
   * Removes problematic query parameters and validates the URL is downloadable
   */
  static validateAndNormalizeImageUrl = (url: string, downloadUrl?: string): string => {
    if (!url || typeof url !== 'string') return url;

    // For any image source, prefer downloadUrl if available and it's a direct image URL
    if (downloadUrl && downloadUrl.trim() && downloadUrl !== url) {
      try {
        const downloadUrlObj = new URL(downloadUrl);
        // If downloadUrl is a direct image URL (not an HTML page), use it
        if (downloadUrlObj.pathname.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
          return downloadUrl;
        }
        // If downloadUrl is a page URL, we can't use it directly
        // Continue with cleaning the original URL
      } catch {
        // downloadUrl is not a valid URL, continue with url
      }
    }

    try {
      const urlObj = new URL(url);

      // Common problematic query parameters that might cause download issues
      const paramsToRemove: string[] = [];

      // Envato-specific parameters
      // Note: Envato preview URLs are protected - only remove watermark parameter
      // Keep w, h, cf_fit, format, q, s as they may be required for the URL to work
      if (url.includes('envatousercontent.com') && url.includes('market-resized')) {
        // Only remove the watermark parameter, keep everything else
        paramsToRemove.push('mark');
        console.log('Cleaning Envato preview URL (removed watermark param only, keeping size params)');
      }

      // Google Images - remove tracking and unnecessary parameters
      if (url.includes('googleusercontent.com') || url.includes('gstatic.com') || url.includes('googleapis.com')) {
        // Remove common Google tracking/redirect parameters
        paramsToRemove.push('usg', 'sig', 'sa', 'source', 'cd', 'ved', 'ictx', 'ei');
        console.log('Cleaning Google image URL (removed tracking params)');
      }

      // General problematic parameters for any image URL
      // Remove parameters that might cause redirects or authentication issues
      const generalParamsToRemove = ['ref', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign'];
      paramsToRemove.push(...generalParamsToRemove);

      // Remove all problematic parameters
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));

      const cleanedUrl = urlObj.toString();
      if (cleanedUrl !== url) {
        console.log('Cleaned image URL:', cleanedUrl);
      }
      return cleanedUrl;
    } catch (e) {
      console.warn('Failed to parse URL:', url, e);
      // Validate it's at least a proper URL format
      try {
        new URL(url);
        return url;
      } catch {
        console.warn('Invalid URL format:', url);
        return url; // Return as-is, let backend handle validation
      }
    }
  };

  // Determine if clip is a local path or Google Drive URL
  static getClipUrl(previewClip: string): string | null {
    if (!previewClip) return null;

    // Check if it's an absolute path (Windows: C:\ or Unix: /)
    const isAbsolutePath = /^[A-Za-z]:[\\/]/.test(previewClip) || previewClip.startsWith('/');

    if (isAbsolutePath) {
      const encodedPath = encodeURIComponent(previewClip);
      return `${API_ENDPOINTS.SERVE_CLIP_BASE}?path=${encodedPath}`;
    } else {
      // Assume it's a Google Drive URL or relative path
      return HelperFunctions.normalizeGoogleDriveUrl(previewClip);
    }
  };

  static isBase64Image(value: string | null | undefined): boolean {
    if (!value || typeof value !== 'string') return false;
    return value.startsWith('data:image/');
  };

  static sanitizePreviewImage(previewImage: string | null | undefined): string {
    if (!previewImage) return '';
    if (HelperFunctions.isBase64Image(previewImage)) {
      return '';
    }
    return previewImage;
  };

  static categorizeFile(mimeType: string): MediaType {

    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    return 'unknown';
  };

}

