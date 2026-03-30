import type { AppSettings } from '@/lib/types';

export type CurrencyCode = 'INR' | 'USD';
export type DateDisplayStyle = 'finance' | 'long' | 'input';

interface CurrencyFormatOptions {
  compact?: boolean;
  currency?: CurrencyCode;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
}

const DEFAULT_CURRENCY_OPTIONS: Required<Omit<CurrencyFormatOptions, 'showSign'>> = {
  compact: false,
  currency: 'INR',
  locale: 'en-IN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

export function getCompactNumberPreference(
  settings?: Pick<AppSettings, 'compactNumbers'>
): boolean {
  return settings?.compactNumbers ?? false;
}

export function formatCurrency(amount: number, options: CurrencyFormatOptions = {}): string {
  const {
    compact,
    currency,
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
    showSign = false,
  } = {
    ...DEFAULT_CURRENCY_OPTIONS,
    ...options,
  };

  const signPrefix = showSign && amount > 0 ? '+' : '';

  return `${signPrefix}${new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)}`;
}

export function formatPercent(value: number, decimals = 2, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(
  date: string | Date,
  locale = 'en-GB',
  style: DateDisplayStyle = 'finance'
): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  if (style === 'input') {
    return parsed.toISOString().split('T')[0];
  }

  if (style === 'long') {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateTime(date: string | Date, locale = 'en-IN'): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function getCurrencyA11yLabel(
  amount: number,
  currency: CurrencyCode = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
