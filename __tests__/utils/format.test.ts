import {
  formatCurrency,
  formatDate,
  formatPercent,
  getCompactNumberPreference,
  getCurrencyA11yLabel,
} from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('formats INR values consistently in standard notation', () => {
    expect(formatCurrency(365783.28)).toBe('₹3,65,783.28');
  });

  it('supports compact formatting for settings-driven display', () => {
    expect(formatCurrency(365783.28, { compact: true, maximumFractionDigits: 2 })).toBe('₹3.66L');
  });
});

describe('formatPercent', () => {
  it('formats percent values with fixed precision', () => {
    expect(formatPercent(12.3456, 2)).toBe('12.35%');
  });
});

describe('formatDate', () => {
  it('uses the shared finance date format across the app', () => {
    expect(formatDate('2026-03-24T12:00:00.000Z')).toBe('24 Mar 2026');
  });

  it('supports input formatting for forms', () => {
    expect(formatDate('2026-03-24T12:00:00.000Z', 'en-GB', 'input')).toBe('2026-03-24');
  });
});

describe('format settings helpers', () => {
  it('defaults compact number preference to false', () => {
    expect(getCompactNumberPreference()).toBe(false);
  });

  it('returns the configured compact number preference', () => {
    expect(getCompactNumberPreference({ compactNumbers: true })).toBe(true);
  });

  it('provides full values for accessibility labels', () => {
    expect(getCurrencyA11yLabel(365783.28)).toBe('₹3,65,783.28');
  });
});
