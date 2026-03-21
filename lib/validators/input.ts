/**
 * Input validation functions for API security
 * Prevents XSS, injection, and other security vulnerabilities
 */

import { isValidEmail, isValidMFCode } from '../utils/string';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * Validate stock search query
 */
export function validateStockQuery(query: string): ValidationResult {
  if (!query || query.trim() === '') {
    return { isValid: false, error: 'Search query is required' };
  }

  if (query.length < 1 || query.length > 50) {
    return { isValid: false, error: 'Query must be between 1 and 50 characters' };
  }

  // Allow alphanumeric, spaces, hyphens, ampersands, and dots
  if (!/^[A-Za-z0-9\s\-&.]+$/.test(query)) {
    return { isValid: false, error: 'Invalid characters in search query' };
  }

  return { isValid: true };
}

/**
 * Validate bond search query / identifier
 */
export function validateBondQuery(query: string): ValidationResult {
  if (!query || query.trim() === '') {
    return { isValid: false, error: 'Bond query is required' };
  }

  const trimmed = query.trim();

  if (trimmed.length < 2 || trimmed.length > 80) {
    return { isValid: false, error: 'Bond query must be between 2 and 80 characters' };
  }

  // Allow ISINs plus common bond search symbols like coupon percentages and bracketed series names.
  if (!/^[A-Za-z0-9\s\-&.%()/]+$/.test(trimmed)) {
    return { isValid: false, error: 'Invalid characters in bond query' };
  }

  return { isValid: true };
}

/**
 * Validate mutual fund code
 */
export function validateMFCode(code: string): ValidationResult {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Mutual fund code is required' };
  }

  if (!isValidMFCode(code)) {
    return { isValid: false, error: 'Invalid mutual fund code format (4-10 digits)' };
  }

  return { isValid: true };
}

/**
 * Validate amount (positive number)
 */
export function validateAmount(amount: number | string, min: number = 0): ValidationResult {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  if (num < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }

  if (num > 1e12) {
    return { isValid: false, error: 'Amount exceeds maximum allowed value' };
  }

  return { isValid: true };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): ValidationResult {
  if (!date || date.trim() === '') {
    return { isValid: false, error: 'Date is required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: 'Invalid date format (use YYYY-MM-DD)' };
  }

  const parsedDate = new Date(date + 'T00:00:00');
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }

  // Verify the parsed date matches the input to catch rollover dates (e.g. Feb 30 → Mar 1)
  const [year, month, day] = date.split('-').map(Number);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return { isValid: false, error: 'Invalid date' };
  }

  return { isValid: true };
}

/**
 * Sanitize and validate string input
 */
export function validateString(
  input: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 255
): ValidationResult {
  if (!input || input.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }

  return { isValid: true };
}

/**
 * Validate integer
 */
export function validateInteger(value: number | string, fieldName: string): ValidationResult {
  const num = typeof value === 'string' ? Number(value) : value;

  if (isNaN(num) || !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a valid integer` };
  }

  return { isValid: true };
}

/**
 * Validate ISIN (International Securities Identification Number)
 * Format: 12 characters - 2 letter country code + 9 alphanumeric + 1 check digit
 */
export function validateISIN(isin: string): ValidationResult {
  if (!isin || isin.trim() === '') {
    return { isValid: true }; // ISIN is optional
  }

  const trimmed = isin.trim().toUpperCase();

  // ISIN must be exactly 12 characters
  if (trimmed.length !== 12) {
    return { isValid: false, error: 'ISIN must be exactly 12 characters' };
  }

  // First 2 characters must be letters (country code)
  if (!/^[A-Z]{2}/.test(trimmed)) {
    return { isValid: false, error: 'ISIN must start with a 2-letter country code' };
  }

  // Next 9 characters must be alphanumeric
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(trimmed)) {
    return { isValid: false, error: 'Invalid ISIN format' };
  }

  return { isValid: true };
}

/**
 * Validate F&O symbol/instrument name
 */
export function validateFnoSymbol(symbol: string): ValidationResult {
  if (!symbol || symbol.trim() === '') {
    return { isValid: false, error: 'F&O symbol is required' };
  }

  if (symbol.length < 2 || symbol.length > 50) {
    return { isValid: false, error: 'F&O symbol must be between 2 and 50 characters' };
  }

  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[A-Za-z0-9\s\-_]+$/.test(symbol)) {
    return { isValid: false, error: 'Invalid characters in F&O symbol' };
  }

  return { isValid: true };
}
