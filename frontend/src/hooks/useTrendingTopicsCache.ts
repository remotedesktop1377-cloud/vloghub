import { useCallback } from 'react';
import { secure } from '../utils/helperFunctions';
import { TRENDING_TOPICS_CACHE_MAX_AGE } from '@/data/constants';

interface CachedData<T> {
  data: T;
  timestamp: string;
}

export const useTrendingTopicsCache = () => {
  const getCacheKey = useCallback((region: string) => `trending_topics_${region}`, []);

  const getCachedData = useCallback(<T>(region: string): T | null => {
    try {
      const cacheKey = getCacheKey(region);
      const cached = secure.j[cacheKey].get();
      if (cached) {
        const { data, timestamp }: CachedData<T> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<T>;
        // Check if cache is less than TRENDING_TOPICS_CACHE_MAX_AGE old
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        if (cacheAge < TRENDING_TOPICS_CACHE_MAX_AGE) {
          console.log('🟡 Cache is valid - returning data');
          return data;
        } else {
          // Cache is expired, remove it
          secure.j[cacheKey].remove();
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
      secure.j[cacheKey].set(cacheData);
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }, [getCacheKey]);

  const clearCache = useCallback((region?: string): void => {
    try {
      if (region) {
        const cacheKey = getCacheKey(region);
        secure.j[cacheKey].remove();
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
      const cached = secure.j[cacheKey].get();
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
      const cached = secure.j[cacheKey].get();
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
