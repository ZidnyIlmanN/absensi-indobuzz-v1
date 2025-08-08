import { i18nService } from '@/services/i18n';

/**
 * Helper functions for common i18n operations
 */

/**
 * Format numbers with proper locale
 */
export const formatNumber = (number: number, locale?: string): string => {
  const currentLocale = locale || (i18nService.getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US');
  
  try {
    return new Intl.NumberFormat(currentLocale).format(number);
  } catch (error) {
    return number.toString();
  }
};

/**
 * Format currency with proper locale
 */
export const formatCurrency = (amount: number, currency?: 'IDR' | 'USD', locale?: string): string => {
  const currentLanguage = locale || i18nService.getCurrentLanguage();
  
  if (currency === 'USD' || (currentLanguage === 'en' && !currency)) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount / 15000); // Rough conversion rate
    } catch (error) {
      return `$${(amount / 15000).toFixed(2)}`;
    }
  } else {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `Rp ${formatNumber(amount, 'id-ID')}`;
    }
  }
};

/**
 * Format date with proper locale
 */
export const formatDate = (
  date: Date, 
  style: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale?: string
): string => {
  const currentLocale = locale || (i18nService.getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US');
  
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    full: { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
  }[style];

  try {
    return new Intl.DateTimeFormat(currentLocale, options).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
};

/**
 * Format time with proper locale
 */
export const formatTime = (date: Date, locale?: string): string => {
  const currentLocale = locale || (i18nService.getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US');
  
  try {
    return new Intl.DateTimeFormat(currentLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (error) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date, locale?: string): string => {
  const currentLanguage = locale || i18nService.getCurrentLanguage();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (currentLanguage === 'id') {
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return formatDate(date, 'short', 'id-ID');
  } else {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date, 'short', 'en-US');
  }
};

/**
 * Get localized day names
 */
export const getDayNames = (locale?: string): string[] => {
  const currentLocale = locale || (i18nService.getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US');
  
  const days = [];
  const date = new Date();
  
  // Get Sunday (0) through Saturday (6)
  for (let i = 0; i < 7; i++) {
    date.setDate(date.getDate() - date.getDay() + i);
    try {
      days.push(new Intl.DateTimeFormat(currentLocale, { weekday: 'long' }).format(date));
    } catch (error) {
      // Fallback to English day names
      const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.push(englishDays[i]);
    }
  }
  
  return days;
};

/**
 * Get localized month names
 */
export const getMonthNames = (locale?: string): string[] => {
  const currentLocale = locale || (i18nService.getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US');
  
  const months = [];
  const date = new Date();
  
  for (let i = 0; i < 12; i++) {
    date.setMonth(i);
    try {
      months.push(new Intl.DateTimeFormat(currentLocale, { month: 'long' }).format(date));
    } catch (error) {
      // Fallback to English month names
      const englishMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      months.push(englishMonths[i]);
    }
  }
  
  return months;
};

/**
 * Pluralization helper for different languages
 */
export const pluralize = (
  count: number, 
  singular: string, 
  plural?: string, 
  locale?: string
): string => {
  const currentLanguage = locale || i18nService.getCurrentLanguage();
  
  if (currentLanguage === 'id') {
    // Indonesian doesn't have complex pluralization rules
    return singular;
  } else {
    // English pluralization
    if (count === 1) {
      return singular;
    } else {
      return plural || `${singular}s`;
    }
  }
};

/**
 * Get text direction for current language
 */
export const getTextDirection = (locale?: string): 'ltr' | 'rtl' => {
  const currentLanguage = locale || i18nService.getCurrentLanguage();
  return i18nService.isRTL(currentLanguage) ? 'rtl' : 'ltr';
};

/**
 * Helper to get localized error messages
 */
export const getLocalizedErrorMessage = (errorKey: string, fallback: string): string => {
  try {
    // This would be used with the translation function
    return fallback; // For now, return fallback
  } catch (error) {
    return fallback;
  }
};