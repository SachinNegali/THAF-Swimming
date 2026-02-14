import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Type-safe AsyncStorage wrapper
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: '@thaf/auth_token',
  REFRESH_TOKEN: '@thaf/refresh_token',
  USER_DATA: '@thaf/user_data',
  THEME: '@thaf/theme',
  ONBOARDING: '@thaf/onboarding',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

/**
 * Save data to AsyncStorage
 */
export async function saveToStorage<T>(key: StorageKey, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(STORAGE_KEYS[key], jsonValue);
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    throw error;
  }
}

/**
 * Get data from AsyncStorage
 */
export async function getFromStorage<T>(key: StorageKey): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS[key]);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return null;
  }
}

/**
 * Remove data from AsyncStorage
 */
export async function removeFromStorage(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS[key]);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    throw error;
  }
}

/**
 * Clear all app data from AsyncStorage
 */
export async function clearStorage(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}
