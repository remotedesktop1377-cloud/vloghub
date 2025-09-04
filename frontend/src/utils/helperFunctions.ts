import { TrendingTopic } from '../types/TrendingTopics';
import { Chapter } from '../types/chapters';

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
        audio: null,
        video: null,
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
}

