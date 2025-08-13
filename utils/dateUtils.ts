/**
 * Date utilities for leave request system
 * Handles multiple date selection, validation, and formatting
 */

export interface DateRange {
  startDate: string;
  endDate: string;
  totalDays: number;
}

export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
  validDates: string[];
  invalidDates: string[];
}

/**
 * Validate an array of date strings
 */
export function validateDateArray(dates: string[]): DateValidationResult {
  const errors: string[] = [];
  const validDates: string[] = [];
  const invalidDates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!dates || dates.length === 0) {
    errors.push('No dates provided');
    return { isValid: false, errors, validDates, invalidDates };
  }

  dates.forEach(dateString => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        errors.push(`Invalid date format: ${dateString}`);
        invalidDates.push(dateString);
        return;
      }

      // Check if date is in the future (or today)
      if (date < today) {
        errors.push(`Date must be today or in the future: ${dateString}`);
        invalidDates.push(dateString);
        return;
      }

      validDates.push(dateString);
    } catch (error) {
      errors.push(`Error parsing date: ${dateString}`);
      invalidDates.push(dateString);
    }
  });

  return {
    isValid: errors.length === 0 && validDates.length > 0,
    errors,
    validDates,
    invalidDates,
  };
}

/**
 * Calculate leave duration for multiple dates
 */
export function calculateLeaveDuration(
  selectedDates: string[],
  leaveType: 'full_day' | 'half_day'
): number {
  if (!selectedDates || selectedDates.length === 0) {
    return 0;
  }

  const actualDays = selectedDates.length;
  
  if (leaveType === 'half_day') {
    return actualDays * 0.5;
  }
  
  return actualDays;
}

/**
 * Check if dates are consecutive
 */
export function areConsecutiveDates(dates: string[]): boolean {
  if (dates.length <= 1) return true;
  
  const sortedDates = [...dates].sort();
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays !== 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate date range between two dates
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return [];
  }
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Group dates by month for display purposes
 */
export function groupDatesByMonth(dates: string[]): { [monthYear: string]: string[] } {
  const groups: { [monthYear: string]: string[] } = {};
  
  dates.forEach(dateString => {
    const date = new Date(dateString);
    const monthYear = date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(dateString);
  });
  
  // Sort dates within each group
  Object.keys(groups).forEach(monthYear => {
    groups[monthYear].sort();
  });
  
  return groups;
}

/**
 * Format multiple dates for display
 */
export function formatMultipleDates(
  dates: string[],
  formatter: (date: string) => string,
  maxDisplay: number = 3
): string {
  if (dates.length === 0) return 'No dates';
  if (dates.length === 1) return formatter(dates[0]);
  
  const sortedDates = [...dates].sort();
  
  if (dates.length <= maxDisplay) {
    return sortedDates.map(formatter).join(', ');
  }
  
  const firstDates = sortedDates.slice(0, maxDisplay - 1).map(formatter);
  const remaining = dates.length - (maxDisplay - 1);
  
  return `${firstDates.join(', ')} +${remaining} more`;
}

/**
 * Detect if multiple dates represent a pattern (e.g., all Fridays)
 */
export function detectDatePattern(dates: string[]): {
  pattern: 'consecutive' | 'weekly' | 'monthly' | 'custom' | 'none';
  description: string;
} {
  if (dates.length <= 1) {
    return { pattern: 'none', description: 'Single date' };
  }

  if (areConsecutiveDates(dates)) {
    return { pattern: 'consecutive', description: 'Consecutive days' };
  }

  // Check for weekly pattern (same day of week)
  const dayOfWeek = new Date(dates[0]).getDay();
  const isWeeklyPattern = dates.every(dateString => {
    return new Date(dateString).getDay() === dayOfWeek;
  });

  if (isWeeklyPattern) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { 
      pattern: 'weekly', 
      description: `All ${dayNames[dayOfWeek]}s` 
    };
  }

  // Check for monthly pattern (same day of month)
  const dayOfMonth = new Date(dates[0]).getDate();
  const isMonthlyPattern = dates.every(dateString => {
    return new Date(dateString).getDate() === dayOfMonth;
  });

  if (isMonthlyPattern) {
    return { 
      pattern: 'monthly', 
      description: `${dayOfMonth}th of each month` 
    };
  }

  return { pattern: 'custom', description: 'Custom selection' };
}

/**
 * Debug function to analyze date selection issues
 */
export function debugDateSelection(data: {
  selectedDates: string[];
  startDate?: string;
  endDate?: string;
  leaveType: 'full_day' | 'half_day';
  storedDuration?: number;
}) {
  const validation = validateDateArray(data.selectedDates);
  const calculatedDuration = calculateLeaveDuration(data.selectedDates, data.leaveType);
  const pattern = detectDatePattern(data.selectedDates);
  const isConsecutive = areConsecutiveDates(data.selectedDates);

  console.log('=== DATE SELECTION DEBUG ===');
  console.log('Input data:', data);
  console.log('Validation result:', validation);
  console.log('Calculated duration:', calculatedDuration);
  console.log('Date pattern:', pattern);
  console.log('Is consecutive:', isConsecutive);
  console.log('Duration mismatch:', data.storedDuration !== calculatedDuration);
  console.log('============================');

  return {
    validation,
    calculatedDuration,
    pattern,
    isConsecutive,
    hasDurationMismatch: data.storedDuration !== calculatedDuration,
  };
}