import { useCallback } from 'react';

interface CachedData<T> {
  data: T;
  timestamp: string;
}

export const useTrendingTopicsCache = () => {
  const getCacheKey = useCallback((region: string) => `trending_topics_${region}`, []);
  
  const getCachedData = useCallback(<T>(region: string): T | null => {
    try {
      const cacheKey = getCacheKey(region);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp }: CachedData<T> = JSON.parse(cached);
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (cacheAge < maxAge) {
          return data;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
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
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }, [getCacheKey]);

  const clearCache = useCallback((region?: string): void => {
    try {
      if (region) {
        const cacheKey = getCacheKey(region);
        localStorage.removeItem(cacheKey);
      } else {
        // Clear all trending topics cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('trending_topics_')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, [getCacheKey]);

  const isCacheValid = useCallback((region: string): boolean => {
    try {
      const cacheKey = getCacheKey(region);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp }: CachedData<any> = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp }: CachedData<any> = JSON.parse(cached);
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
