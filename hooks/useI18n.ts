import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { i18nService } from '@/services/i18n';
import { AppState, AppStateStatus } from 'react-native';

interface UseI18nReturn {
  t: (key: string, options?: any) => string;
  currentLanguage: string;
  availableLanguages: Array<{ code: string; name: string; nativeName: string }>;
  changeLanguage: (languageCode: string) => Promise<void>;
  isRTL: boolean;
  formatNumber: (number: number) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  isChangingLanguage: boolean;
}

export function useI18n(): UseI18nReturn {
  const { t, i18n } = useTranslation();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const currentLanguage = i18n.language || 'en';
  const availableLanguages = i18nService.getAvailableLanguages();
  const isRTL = i18nService.isRTL(currentLanguage);

  const changeLanguage = useCallback(async (languageCode: string) => {
    if (languageCode === currentLanguage) return;

    setIsChangingLanguage(true);
    try {
      await i18nService.changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsChangingLanguage(false);
    }
  }, [currentLanguage]);

  const formatNumber = useCallback((number: number) => {
    return i18nService.formatNumber(number);
  }, [currentLanguage]);

  const formatCurrency = useCallback((amount: number) => {
    return i18nService.formatCurrency(amount);
  }, [currentLanguage]);

  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions) => {
    return i18nService.formatDate(date, options);
  }, [currentLanguage]);

  const formatDateString = useCallback((dateString: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(dateString);
    return formatDate(date, options);
  }, [formatDate]);

  const getDateFormat = useCallback(() => {
    return currentLanguage === 'id' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
  }, [currentLanguage]);

  const formatLeaveDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const locale = currentLanguage === 'id' ? 'id-ID' : 'en-US';
    
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }, [currentLanguage]);

  const formatLeaveDateShort = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const locale = currentLanguage === 'id' ? 'id-ID' : 'en-US';
    
    try {
      if (currentLanguage === 'id') {
        return new Intl.DateTimeFormat(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      } else {
        return new Intl.DateTimeFormat(locale, {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        }).format(date);
      }
    } catch (error) {
      return date.toLocaleDateString();
    }
  }, [currentLanguage]);

  const formatSubmissionDate = useCallback((date: Date) => {
    const locale = currentLanguage === 'id' ? 'id-ID' : 'en-US';
    
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }, [currentLanguage]);

  // Listen to app state changes to refresh translations if needed
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh current language when app becomes active
        // This helps with language sync across app restarts
        const savedLanguage = i18nService.getCurrentLanguage();
        if (savedLanguage !== currentLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [currentLanguage, i18n]);

  return {
    t,
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isRTL,
    formatNumber,
    formatCurrency,
    formatDate,
    formatDateString,
    formatLeaveDate,
    formatLeaveDateShort,
    formatSubmissionDate,
    getDateFormat,
    isChangingLanguage,
  };
}

/**
 * Hook for translating with namespace support
 */
export function useTranslationWithNamespace(namespace: string) {
  const { t: originalT, ...rest } = useTranslation();
  
  const t = useCallback((key: string, options?: any) => {
    return originalT(`${namespace}.${key}`, options);
  }, [originalT, namespace]);

  return { t, ...rest };
}

/**
 * Hook for currency formatting with proper locale
 */
export function useCurrency() {
  const { currentLanguage } = useI18n();
  
  const formatCurrency = useCallback((amount: number, currency?: 'IDR' | 'USD') => {
    const lang = currentLanguage;
    
    if (currency === 'USD' || (lang === 'en' && !currency)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount / 15000); // Rough conversion rate
    } else {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  }, [currentLanguage]);

  return { formatCurrency };
}

/**
 * Hook for date formatting with proper locale
 */
export function useLocalizedDate() {
  const { currentLanguage } = useI18n();
  
  const formatDate = useCallback((
    date: Date, 
    style: 'short' | 'medium' | 'long' | 'full' = 'medium'
  ) => {
    const locale = currentLanguage === 'id' ? 'id-ID' : 'en-US';
    
    const options: Intl.DateTimeFormatOptions = (() => {
      switch (style) {
        case 'short': return { month: 'short', day: 'numeric' };
        case 'medium': return { month: 'short', day: 'numeric', year: 'numeric' };
        case 'long': return { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        case 'full': return {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
      }
    })();

    return new Intl.DateTimeFormat(locale, options).format(date);
  }, [currentLanguage]);

  const formatTime = useCallback((date: Date) => {
    const locale = currentLanguage === 'id' ? 'id-ID' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }, [currentLanguage]);

  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return currentLanguage === 'id' ? 'Baru saja' : 'Just now';
    } else if (minutes < 60) {
      return currentLanguage === 'id' ? `${minutes} menit lalu` : `${minutes}m ago`;
    } else if (hours < 24) {
      return currentLanguage === 'id' ? `${hours} jam lalu` : `${hours}h ago`;
    } else if (days < 7) {
      return currentLanguage === 'id' ? `${days} hari lalu` : `${days}d ago`;
    } else {
      return formatDate(date, 'short');
    }
  }, [currentLanguage, formatDate]);

  return {
    formatDate,
    formatTime,
    formatRelativeTime,
  };
}