import { useCallback } from 'react';
import { secure } from '../utils/helperFunctions';
import { TRENDING_TOPICS_CACHE_MAX_AGE } from '@/data/constants';

interface CachedData<T> {
  data: T;
  timestamp: string;
}

export const useTrendingTopicsCache = () => {
  const getCacheKey = useCallback((searchQuery: string, dateRange: string) => `trending_topics_${searchQuery}_${dateRange}`, []);

  const getCachedData = useCallback(<T>(searchQuery: string, dateRange: string): T | null => {
    try {
      const cacheKey = getCacheKey(searchQuery, dateRange);
      console.log('🟢 getting cache key:', cacheKey);
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

  const setCachedData = useCallback(<T>(searchQuery: string, dateRange: string, data: T): void => {
    try {
      const cacheKey = getCacheKey(searchQuery, dateRange);
      console.log('🟢 saving cache key:', cacheKey);
      const cacheData: CachedData<T> = {
        data,
        timestamp: new Date().toISOString()
      };
      secure.j[cacheKey].set(cacheData);
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }, [getCacheKey]);

  const clearCache = useCallback((searchQuery?: string, dateRange?: string): void => {
    try {
      if (searchQuery) {
        const cacheKey = getCacheKey(searchQuery, dateRange || '');
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

  const isCacheValid = useCallback((searchQuery: string, dateRange: string): boolean => {
    try {
      const cacheKey = getCacheKey(searchQuery, dateRange);
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

  const getCacheAge = useCallback((searchQuery: string, dateRange: string): number | null => {
    try {
      const cacheKey = getCacheKey(searchQuery, dateRange);
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
