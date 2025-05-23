import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class Cache {
  static async set<T>(key: string, data: T, expiryMs: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  static async get<T>(key: string, expiryMs: number): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() - entry.timestamp > expiryMs) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  static async withCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiryMs: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await Cache.get<T>(key, expiryMs);
      if (cached) return cached;

      // Cache miss - fetch fresh data
      const freshData = await fetchFn();
      
      // Cache the new data
      await Cache.set(key, freshData, expiryMs);
      
      return freshData;
    } catch (error) {
      console.warn('Cache operation failed:', error);
      // If cache operations fail, still try to get fresh data
      return fetchFn();
    }
  }
} 