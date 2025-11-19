import AsyncStorage from '@react-native-async-storage/async-storage';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { Platform } from 'react-native';

// Create a safe storage implementation that works on all platforms
const createSafeStorage = () => {
  if (Platform.OS === 'web') {
    // For web, use localStorage as fallback
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(key);
          }
          return null;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    };
  } else {
    // For native platforms, use AsyncStorage
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          const value = await AsyncStorage.getItem(key);
          return value;
        } catch (error) {
          console.error('Error reading from AsyncStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to AsyncStorage:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from AsyncStorage:', error);
        }
      },
    };
  }
};

const asyncStorage = createSafeStorage();

export const atomWithAsyncStorage = <T>(key: string, initialValue: T) =>
  atomWithStorage<T>(key, initialValue, createJSONStorage<T>(() => asyncStorage)); 