/**
 * Number utility functions for financial calculations
 */

export interface FormatCurrencyOptions {
  /** Use compact notation (₹3.66L, ₹1.2Cr) for INR. Default: false */
  compact?: boolean;
  /** Number of decimal places. Default: 2 */
  decimals?: number;
}

/**
 * Format number as currency.
 * For INR with compact=true, uses Indian short-scale suffixes: K (thousand), L (lakh), Cr (crore).
 */
export function formatCurrency(
  amount: number,
  currency: 'INR' | 'USD' = 'INR',
  localeOrOptions: string | FormatCurrencyOptions = 'en-IN',
  options: FormatCurrencyOptions = {}
): string {
  // Support both legacy string locale and new options-object call signature
  const opts: FormatCurrencyOptions =
    typeof localeOrOptions === 'object' ? localeOrOptions : options;
  const locale = typeof localeOrOptions === 'string' ? localeOrOptions : 'en-IN';

  if (opts.compact && currency === 'INR') {
    return formatCurrencyCompact(amount, opts.decimals ?? 2);
  }

  const decimals = opts.decimals ?? 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format INR amount using Indian short-scale compact notation.
 * Examples: ₹3.66L (lakh), ₹1.2Cr (crore), ₹50K (thousand), ₹500 (plain).
 * Full (unrounded) value is returned as a data attribute for tooltips via `title`.
 */
export function formatCurrencyCompact(amount: number, decimals: number = 2): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_00_00_000) {
    // ≥ 1 Crore
    return `${sign}₹${(abs / 1_00_00_000).toFixed(decimals)}Cr`;
  }
  if (abs >= 1_00_000) {
    // ≥ 1 Lakh
    return `${sign}₹${(abs / 1_00_000).toFixed(decimals)}L`;
  }
  if (abs >= 1_000) {
    // ≥ 1 Thousand
    return `${sign}₹${(abs / 1_000).toFixed(decimals)}K`;
  }
  return `${sign}₹${abs.toFixed(decimals)}`;
}

/**
 * Format a number as a percentage string.
 * @param value   The numeric percentage value (e.g. 12.5 for 12.5%)
 * @param decimals Number of decimal places (default: 2)
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format number with locale formatting
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Round to specified decimal places
 */
export function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Check if number is within range
 */
export function inRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Parse number from string safely
 */
export function safeParseNumber(value: string | number, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(0);
}
