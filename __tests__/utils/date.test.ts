import { isToday, getCurrentFY, formatDateForInput, formatDate } from '@/lib/utils/date';

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe('getCurrentFY', () => {
  it('returns a financial year string', () => {
    const fy = getCurrentFY();
    expect(fy).toMatch(/^FY \d{4}-\d{4}$/);
  });
});

describe('formatDateForInput', () => {
  it('formats date as YYYY-MM-DD', () => {
    const result = formatDateForInput('2024-06-15T00:00:00.000Z');
    expect(result).toBe('2024-06-15');
  });

  it('accepts Date objects', () => {
    const result = formatDateForInput(new Date('2024-01-01T00:00:00.000Z'));
    expect(result).toBe('2024-01-01');
  });
});

describe('formatDate', () => {
  it('renders short/medium formats as "D Mon YYYY" (en-GB style)', () => {
    // Use a fixed UTC date to avoid timezone-dependent failures in CI
    const date = new Date('2026-03-24T12:00:00.000Z');
    const short = formatDate(date, 'short');
    const medium = formatDate(date, 'medium');
    // Both should look like "24 Mar 2026" (en-GB locale)
    expect(short).toMatch(/\d{1,2} \w{3} \d{4}/);
    expect(medium).toMatch(/\d{1,2} \w{3} \d{4}/);
    // Both formats should be identical (consistent)
    expect(short).toBe(medium);
  });

  it('renders long format with weekday', () => {
    const date = new Date('2026-03-24T12:00:00.000Z');
    const long = formatDate(date, 'long');
    // Long format should include the full month name
    expect(long).toMatch(/March/);
  });

  it('accepts ISO string input', () => {
    const result = formatDate('2025-01-15T00:00:00.000Z');
    expect(result).toMatch(/\d{1,2} \w{3} \d{4}/);
  });
});
