export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

export const validateNumeric = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

export const validatePositiveNumber = (value: string): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export interface ValidationRule {
  validator: (value: string) => boolean;
  message: string;
}

export const validateField = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (!rule.validator(value)) {
      return rule.message;
    }
  }
  return null;
};

export const createValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validator: validateRequired,
    message,
  }),
  
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validator: validateEmail,
    message,
  }),
  
  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    validator: validatePhone,
    message,
  }),
  
  minLength: (length: number, message?: string): ValidationRule => ({
    validator: (value) => validateMinLength(value, length),
    message: message || `Minimum ${length} characters required`,
  }),
  
  maxLength: (length: number, message?: string): ValidationRule => ({
    validator: (value) => validateMaxLength(value, length),
    message: message || `Maximum ${length} characters allowed`,
  }),
  
  numeric: (message = 'Please enter a valid number'): ValidationRule => ({
    validator: validateNumeric,
    message,
  }),
  
  positiveNumber: (message = 'Please enter a positive number'): ValidationRule => ({
    validator: validatePositiveNumber,
    message,
  }),
};