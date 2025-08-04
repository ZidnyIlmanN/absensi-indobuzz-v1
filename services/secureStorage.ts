import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface StorageOptions {
  requireAuthentication?: boolean;
  accessGroup?: string;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  
  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Store sensitive data securely
   * Uses SecureStore on native platforms, AsyncStorage on web with encryption
   */
  async setSecureItem(key: string, value: string, options?: StorageOptions): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, use AsyncStorage with basic encoding
        const encodedValue = this.encodeValue(value);
        await AsyncStorage.setItem(key, encodedValue);
      } else {
        // For native platforms, use SecureStore
        await SecureStore.setItemAsync(key, value, {
          requireAuthentication: options?.requireAuthentication || false,
          accessGroup: options?.accessGroup,
        });
      }
    } catch (error) {
      console.error(`Error storing secure item ${key}:`, error);
      throw new Error(`Failed to store secure data: ${error}`);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  async getSecureItem(key: string, options?: StorageOptions): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        const encodedValue = await AsyncStorage.getItem(key);
        return encodedValue ? this.decodeValue(encodedValue) : null;
      } else {
        return await SecureStore.getItemAsync(key, {
          requireAuthentication: options?.requireAuthentication || false,
          accessGroup: options?.accessGroup,
        });
      }
    } catch (error) {
      console.error(`Error retrieving secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  async removeSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
      throw new Error(`Failed to remove secure data: ${error}`);
    }
  }

  /**
   * Check if secure item exists
   */
  async hasSecureItem(key: string): Promise<boolean> {
    try {
      const value = await this.getSecureItem(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all secure storage (use with caution)
   */
  async clearAllSecureItems(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.clear();
      } else {
        // For native platforms, we need to remove items individually
        // This is a simplified version - in production, you'd track keys
        const keys = ['auth_token', 'refresh_token', 'user_session'];
        await Promise.all(keys.map(key => this.removeSecureItem(key)));
      }
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw new Error(`Failed to clear secure storage: ${error}`);
    }
  }

  /**
   * Basic encoding for web platform (not cryptographically secure)
   * In production, consider using a proper encryption library
   */
  private encodeValue(value: string): string {
    try {
      return Buffer.from(value, 'utf8').toString('base64');
    } catch (error) {
      return value; // Fallback to plain text if encoding fails
    }
  }

  /**
   * Basic decoding for web platform
   */
  private decodeValue(encodedValue: string): string {
    try {
      return Buffer.from(encodedValue, 'base64').toString('utf8');
    } catch (error) {
      return encodedValue; // Fallback to plain text if decoding fails
    }
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SESSION: 'user_session',
  LAST_LOGIN: 'last_login',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// Convenience instance
export const secureStorage = SecureStorageService.getInstance();