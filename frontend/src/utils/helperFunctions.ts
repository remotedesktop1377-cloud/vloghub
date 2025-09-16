import { TrendingTopic } from '../types/TrendingTopics';
import { Chapter } from '../types/chapters';
import { toast, ToastOptions } from 'react-toastify';
import { API_ENDPOINTS } from '../config/apiEndpoints';

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
  setApprovedScript: (scriptData: any) => secure.j.approvedScript.set(scriptData),

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
   * Merge a chapter's assets with any media referenced in keywordsSelected.
   * Ensures assets.images includes low/high media URLs without duplicates.
   */
  static ensureAssetsContainKeywordMedia(chapter: Chapter): Chapter {
    const existingImages = Array.isArray(chapter.assets?.images) ? (chapter.assets!.images as string[]) : [];
    const keywordImages = HelperFunctions.extractImageUrlsFromKeywordsSelected((chapter as any).keywordsSelected);
    const merged = Array.from(new Set([...(existingImages || []), ...keywordImages].filter(Boolean)));
    return {
      ...chapter,
      assets: {
        ...(chapter.assets || {} as any),
        images: merged
      } as any
    } as Chapter;
  }

  /**
   * Update a single scene JSON on the server/Drive and ensure assets are synced.
   * Returns true on success.
   */
  static async updateChapterSceneOnDrive(jobName: string, jobId: string, sceneId: string, chapter: Chapter): Promise<boolean> {
    try {
      const chapterWithAssets = HelperFunctions.ensureAssetsContainKeywordMedia(chapter);
      const scene = {
        id: chapterWithAssets.id,
        narration: chapterWithAssets.narration,
        duration: chapterWithAssets.duration,
        durationInSeconds: (chapterWithAssets as any).durationInSeconds,
        words: (chapterWithAssets as any).words,
        startTime: (chapterWithAssets as any).startTime,
        endTime: (chapterWithAssets as any).endTime,
        highlightedKeywords: chapterWithAssets.highlightedKeywords || [],
        keywordsSelected: Array.isArray((chapterWithAssets as any).keywordsSelected) ? (chapterWithAssets as any).keywordsSelected : [],
        assets: {
          images: chapterWithAssets.assets?.images || []
        }
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
      console.error('updateChapterSceneOnDrive error', e);
      return false;
    }
  }

  /**
   * Persist a chapter scene change to Drive and show toast feedback
   */
  static async persistSceneUpdate(
    jobInfo: { jobId?: string; jobName?: string } | null | undefined,
    chapters: Chapter[],
    chapterIndex: number,
    successMessage: string = 'Scene updated on Drive'
  ): Promise<void> {
    try {
      const chapter = chapters?.[chapterIndex];
      if (!chapter) return;
      const sceneId = String((chapter as any).id || '');
      const jobId = String((chapter as any).jobId || jobInfo?.jobId || '');
      const jobName = String((chapter as any).jobName || jobInfo?.jobName || '');
      if (!jobId || !sceneId) return;
      const ok = await HelperFunctions.updateChapterSceneOnDrive(jobName, jobId, sceneId, chapter);
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
   * Add a new chapter after a specific index
   */
  static addChapterAfter(
    index: number,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void
  ): void {
    const newChapter: Chapter = {
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

    const updatedChapters = [...chapters];
    updatedChapters.splice(index + 1, 0, newChapter);
    setChapters(updatedChapters);
  }

  /**
   * Delete a chapter at a specific index
   */
  static deleteChapter(
    index: number,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void
  ): void {
    const updatedChapters = chapters.filter((_, i) => i !== index);
    setChapters(updatedChapters);
  }

  /**
   * Save edited chapter
   */
  static saveEdit(
    index: number,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void,
    editHeading: string,
    editNarration: string,
    setEditingChapter: (index: number | null) => void
  ): void {
    const updatedChapters = [...chapters];

    updatedChapters[index] = {
      ...updatedChapters[index],
      // update the model change here as well
      duration: updatedChapters[index].duration,
      assets: updatedChapters[index].assets,
    };
    setChapters(updatedChapters);
    setEditingChapter(null);
  }

  /**
   * Cancel chapter editing
   */
  static cancelEdit(
    setEditingChapter: (index: number | null) => void,
    setEditHeading: (heading: string) => void,
    setEditNarration: (narration: string) => void
  ): void {
    setEditingChapter(null);
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
    if (!script.trim()) return '0';

    const words = script.trim().split(/\s+/).length;
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
   * Extract image URLs from a chapter's keywordsSelected map.
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
          mainContent: 'اہم مواد',
          conclusion: 'نتیجہ',
          callToAction: 'کارروائی کا مطالبہ'
        };
      case 'arabic':
        return {
          title: 'عنوان',
          hook: 'خطاب',
          mainContent: 'المحتوى الرئيسي',
          conclusion: 'خاتمة',
          callToAction: 'دعوة للعمل'
        };
      case 'hindi':
        return {
          title: 'शीर्षक',
          hook: 'हुक',
          mainContent: 'मुख्य सामग्री',
          conclusion: 'निष्कर्ष',
          callToAction: 'कार्रवाई का आह्वान'
        };
      default: // english and other languages
        return {
          title: 'TITLE',
          hook: 'HOOK',
          mainContent: 'MAIN CONTENT',
          conclusion: 'CONCLUSION',
          callToAction: 'CALL TO ACTION'
        };
    }
  };

  /**
   * Call Gemini endpoint to get highlighted keywords for chapters and merge into chapters array
   */
  static async fetchAndApplyHighlightedKeywords(
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void,
    chaptersUpdated: (chapters: Chapter[]) => void
  ): Promise<void> {
    let bestChapters: Chapter[] = chapters;
    try {
      const payload = chapters.map(c => ({ id: c.id, narration: c.narration }));
      const res = await fetch('/api/gemini-highlight-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: payload })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get highlighted keywords');
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
      const updated = chapters.map(ch => ({
        ...ch,
        highlightedKeywords: map[ch.id] && map[ch.id].length > 0 ? map[ch.id] : (ch.highlightedKeywords || [])
      }));
      setChapters(updated);
      bestChapters = updated;
    } catch (e) {
      console.error('highlight extraction failed', e);
      HelperFunctions.showError(e instanceof Error ? e.message : 'Failed to extract highlighted keywords');
    } finally {
      // Ensure callback is invoked even on failure, with best available chapters
      try {
        chaptersUpdated(bestChapters);
      } catch { }
    }
  }
}

