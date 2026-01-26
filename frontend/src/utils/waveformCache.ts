/**
 * Waveform data cache using IndexedDB
 */

const DB_NAME = 'VideoEditorWaveforms';
const DB_VERSION = 1;
const STORE_NAME = 'waveforms';

interface WaveformCacheEntry {
  key: string;
  waveformData: {
    peaks: number[];
    duration: number;
    sampleRate: number;
  };
  timestamp: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Generate cache key from audio URL
 */
export function getWaveformCacheKey(audioUrl: string): string {
  return `waveform-${audioUrl}`;
}

/**
 * Get waveform from cache
 */
export async function getCachedWaveform(cacheKey: string): Promise<WaveformCacheEntry['waveformData'] | null> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result as WaveformCacheEntry | undefined;
        if (result && result.waveformData) {
          // Check if cache entry is not too old (30 days)
          const maxAge = 30 * 24 * 60 * 60 * 1000;
          if (Date.now() - result.timestamp < maxAge) {
            resolve(result.waveformData);
          } else {
            // Cache expired, delete it
            deleteCachedWaveform(cacheKey);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null); // Fail silently
      };
    });
  } catch (error) {
    console.error('Error getting cached waveform:', error);
    return null;
  }
}

/**
 * Cache waveform data
 */
export async function cacheWaveform(
  cacheKey: string,
  waveformData: WaveformCacheEntry['waveformData']
): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: WaveformCacheEntry = {
        key: cacheKey,
        waveformData,
        timestamp: Date.now(),
      };

      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to cache waveform'));
      };
    });
  } catch (error) {
    console.error('Error caching waveform:', error);
  }
}

/**
 * Delete cached waveform
 */
export async function deleteCachedWaveform(cacheKey: string): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(cacheKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete cached waveform'));
      };
    });
  } catch (error) {
    console.error('Error deleting cached waveform:', error);
  }
}

/**
 * Get or generate waveform with caching
 */
export async function getOrGenerateWaveform(
  audioUrl: string,
  generateFn: () => Promise<WaveformCacheEntry['waveformData']>
): Promise<WaveformCacheEntry['waveformData'] | null> {
  const cacheKey = getWaveformCacheKey(audioUrl);
  
  // Try to get from cache first
  const cached = await getCachedWaveform(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Generate new waveform
  try {
    const waveform = await generateFn();
    if (waveform) {
      // Cache it
      await cacheWaveform(cacheKey, waveform);
    }
    return waveform;
  } catch (error) {
    console.error('Failed to generate waveform:', error);
    return null;
  }
}

