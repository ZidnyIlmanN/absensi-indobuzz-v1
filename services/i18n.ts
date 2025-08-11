import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization'; // This import is correct and should not cause an error if expo-localization is installed.
import { Platform } from 'react-native';

// Import translation files
import en from '@/locales/en.json';
import id from '@/locales/id.json';

const LANGUAGE_STORAGE_KEY = 'user_language_preference';

// Language detection
const getDeviceLanguage = (): string => {
  try {
    const deviceLocale = Localization.getLocales()[0]?.languageCode;
    if (!deviceLocale) {
      return 'en'; // Fallback if no locale is found
    }
    const languageCode = deviceLocale.split('-')[0];
    
    // Check if device language is supported
    if (['en', 'id'].includes(languageCode)) {
      return languageCode;
    }
    
    // Fallback to English
    return 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};

// Custom language detector
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First, try to get saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && ['en', 'id'].includes(savedLanguage)) {
        console.log('Using saved language:', savedLanguage);
        callback(savedLanguage);
        return;
      }
      
      // If no saved preference, use device language
      const deviceLanguage = getDeviceLanguage();
      console.log('Using device language:', deviceLanguage);
      callback(deviceLanguage);
    } catch (error) {
      console.error('Language detection error:', error);
      callback('en'); // Fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      console.log('Language preference saved:', lng);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  },
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      id: { translation: id },
    },
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
    compatibilityJSON: 'v4', // Use v4 format for better compatibility
  });

export default i18n;

// Helper functions for language management
export const i18nService = {
  /**
   * Change language and persist preference
   */
  async changeLanguage(languageCode: string): Promise<void> {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      console.log('Language changed to:', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
      throw new Error('Failed to change language');
    }
  },

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return i18n.language || 'en';
  },

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    ];
  },

  /**
   * Check if language is RTL
   */
  isRTL(languageCode?: string): boolean {
    const lang = languageCode || this.getCurrentLanguage();
    // Indonesian and English are both LTR languages
    // Add RTL languages here if needed in the future
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(lang);
  },

  /**
   * Get language display name
   */
  getLanguageDisplayName(languageCode: string): string {
    const languages = this.getAvailableLanguages();
    const language = languages.find(lang => lang.code === languageCode);
    return language?.nativeName || languageCode.toUpperCase();
  },

  /**
   * Format number according to current locale
   */
  formatNumber(number: number): string {
    const lang = this.getCurrentLanguage();
    const locale = lang === 'id' ? 'id-ID' : 'en-US';
    
    try {
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      return number.toString();
    }
  },

  /**
   * Format currency according to current locale
   */
  formatCurrency(amount: number): string {
    const lang = this.getCurrentLanguage();
    
    if (lang === 'id') {
      return `Rp ${this.formatNumber(amount)}`;
    } else {
      return `$${this.formatNumber(amount / 15000)}`; // Rough USD conversion
    }
  },

  /**
   * Format date according to current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const lang = this.getCurrentLanguage();
    const locale = lang === 'id' ? 'id-ID' : 'en-US';
    
    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  },
};