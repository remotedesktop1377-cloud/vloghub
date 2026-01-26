/**
 * Thumbnail cache using IndexedDB
 */

const DB_NAME = 'VideoEditorThumbnails';
const DB_VERSION = 1;
const STORE_NAME = 'thumbnails';

interface ThumbnailCacheEntry {
  key: string;
  thumbnailUrl: string;
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
 * Generate cache key from clip
 */
export function getThumbnailCacheKey(clipId: string, mediaId: string, timeInSeconds: number = 0): string {
  return `${clipId}-${mediaId}-${timeInSeconds.toFixed(2)}`;
}

/**
 * Get thumbnail from cache
 */
export async function getCachedThumbnail(cacheKey: string): Promise<string | null> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result as ThumbnailCacheEntry | undefined;
        if (result && result.thumbnailUrl) {
          // Check if cache entry is not too old (7 days)
          const maxAge = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - result.timestamp < maxAge) {
            resolve(result.thumbnailUrl);
          } else {
            // Cache expired, delete it
            deleteCachedThumbnail(cacheKey);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null); // Fail silently, just return null
      };
    });
  } catch (error) {
    console.error('Error getting cached thumbnail:', error);
    return null;
  }
}

/**
 * Cache thumbnail
 */
export async function cacheThumbnail(cacheKey: string, thumbnailUrl: string): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: ThumbnailCacheEntry = {
        key: cacheKey,
        thumbnailUrl,
        timestamp: Date.now(),
      };

      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to cache thumbnail'));
      };
    });
  } catch (error) {
    console.error('Error caching thumbnail:', error);
  }
}

/**
 * Delete cached thumbnail
 */
export async function deleteCachedThumbnail(cacheKey: string): Promise<void> {
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
        reject(new Error('Failed to delete cached thumbnail'));
      };
    });
  } catch (error) {
    console.error('Error deleting cached thumbnail:', error);
  }
}

/**
 * Clear all cached thumbnails
 */
export async function clearThumbnailCache(): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear thumbnail cache'));
      };
    });
  } catch (error) {
    console.error('Error clearing thumbnail cache:', error);
  }
}

/**
 * Get or generate thumbnail with caching
 */
export async function getOrGenerateThumbnail(
  clip: { id: string; mediaId: string; mediaType: 'video' | 'image' | 'audio' | 'text'; startTime?: number },
  generateFn: () => Promise<string | null>
): Promise<string | null> {
  const cacheKey = getThumbnailCacheKey(clip.id, clip.mediaId, clip.startTime || 0);
  
  // Try to get from cache first
  const cached = await getCachedThumbnail(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Generate new thumbnail
  const thumbnail = await generateFn();
  if (thumbnail) {
    // Cache it
    await cacheThumbnail(cacheKey, thumbnail);
  }
  
  return thumbnail;
}

