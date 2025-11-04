import { useCallback } from 'react';
import { secure } from '../utils/helperFunctions';
import { TRENDING_TOPICS_CACHE_MAX_AGE } from '@/data/constants';
import { BackgroundItem } from '@/services/profileService';

interface CachedData<T> {
  data: T;
  timestamp: string;
}

const BACKGROUNDS_CACHE_KEY = 'backgrounds_cache';

export const useBackgroundsCache = () => {
  const getCachedData = useCallback((): BackgroundItem[] | null => {
    try {
      const cached = secure.j[BACKGROUNDS_CACHE_KEY].get();
      if (cached) {
        const { data, timestamp }: CachedData<BackgroundItem[]> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<BackgroundItem[]>;
        // Check if cache is less than TRENDING_TOPICS_CACHE_MAX_AGE old
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        if (cacheAge < TRENDING_TOPICS_CACHE_MAX_AGE) {
          console.log('🟡 Backgrounds cache is valid - returning cached data');
          return data;
        } else {
          // Cache is expired, remove it
          console.log('🔴 Backgrounds cache expired - removing');
          secure.j[BACKGROUNDS_CACHE_KEY].remove();
        }
      }
    } catch (error) {
      console.warn('Error reading backgrounds cache:', error);
    }
    return null;
  }, []);

  const setCachedData = useCallback((data: BackgroundItem[]): void => {
    try {
      const cacheData: CachedData<BackgroundItem[]> = {
        data,
        timestamp: new Date().toISOString()
      };
      secure.j[BACKGROUNDS_CACHE_KEY].set(cacheData);
      console.log('✅ Backgrounds cached successfully');
    } catch (error) {
      console.warn('Error writing backgrounds cache:', error);
    }
  }, []);

  const clearCache = useCallback((): void => {
    try {
      secure.j[BACKGROUNDS_CACHE_KEY].remove();
      console.log('🗑️ Backgrounds cache cleared');
    } catch (error) {
      console.warn('Error clearing backgrounds cache:', error);
    }
  }, []);

  const isCacheValid = useCallback((): boolean => {
    try {
      const cached = secure.j[BACKGROUNDS_CACHE_KEY].get();
      if (cached) {
        const { timestamp }: CachedData<BackgroundItem[]> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<BackgroundItem[]>;
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        return cacheAge < TRENDING_TOPICS_CACHE_MAX_AGE;
      }
    } catch (error) {
      console.warn('Error checking backgrounds cache validity:', error);
    }
    return false;
  }, []);

  const getCacheAge = useCallback((): number | null => {
    try {
      const cached = secure.j[BACKGROUNDS_CACHE_KEY].get();
      if (cached) {
        const { timestamp }: CachedData<BackgroundItem[]> = typeof cached === 'string' ? JSON.parse(cached) : cached as CachedData<BackgroundItem[]>;
        return Date.now() - new Date(timestamp).getTime();
      }
    } catch (error) {
      console.warn('Error getting backgrounds cache age:', error);
    }
    return null;
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    isCacheValid,
    getCacheAge
  };
};

