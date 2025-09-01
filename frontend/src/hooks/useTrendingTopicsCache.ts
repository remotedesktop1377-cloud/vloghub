import { useCallback } from 'react';
import secureLocalStorage from 'react-secure-storage';

interface CachedData<T> {
  data: T;
  timestamp: string;
}

export const useTrendingTopicsCache = () => {
  const getCacheKey = useCallback((region: string) => `trending_topics_${region}`, []);

  const getCachedData = useCallback(<T>(region: string): T | null => {
    try {
      const cacheKey = getCacheKey(region);
      const cached = secureLocalStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp }: CachedData<T> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<T>;
        // Check if cache is less than 30 minutes old
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds

        if (cacheAge < maxAge) {
          return data;
        } else {
          // Remove expired cache
          secureLocalStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Error reading from cache:', error);
    }
    return null;
  }, [getCacheKey]);

  const setCachedData = useCallback(<T>(region: string, data: T): void => {
    try {
      const cacheKey = getCacheKey(region);
      const cacheData: CachedData<T> = {
        data,
        timestamp: new Date().toISOString()
      };
      secureLocalStorage.setItem(cacheKey, cacheData);
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }, [getCacheKey]);

  const clearCache = useCallback((region?: string): void => {
    try {
      if (region) {
        const cacheKey = getCacheKey(region);
        secureLocalStorage.removeItem(cacheKey);
      } else {
        // Clear all trending topics cache
        // Note: react-secure-storage doesn't have a direct way to get all keys
        // We'll need to clear specific known cache keys or use a different approach
        // console.warn('Clearing all cache not directly supported with secure storage');
      }
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, [getCacheKey]);

  const isCacheValid = useCallback((region: string): boolean => {
    try {
      const cacheKey = getCacheKey(region);
      const cached = secureLocalStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp }: CachedData<any> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<any>;
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds
        return cacheAge < maxAge;
      }
    } catch (error) {
      console.warn('Error checking cache validity:', error);
    }
    return false;
  }, [getCacheKey]);

  const getCacheAge = useCallback((region: string): number | null => {
    try {
      const cacheKey = getCacheKey(region);
      const cached = secureLocalStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp }: CachedData<any> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<any>;
        return Date.now() - new Date(timestamp).getTime();
      }
    } catch (error) {
      console.warn('Error getting cache age:', error);
    }
    return null;
  }, [getCacheKey]);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    isCacheValid,
    getCacheAge,
    getCacheKey
  };
};
