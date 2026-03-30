import {
  calculatePercentage,
  calculatePercentageChange,
  roundTo,
  clamp,
  inRange,
  safeParseNumber,
  formatCompactNumber,
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
} from '@/lib/utils/number';

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
  });

  it('returns 0 when total is 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });
});

describe('calculatePercentageChange', () => {
  it('calculates percentage change', () => {
    expect(calculatePercentageChange(100, 150)).toBe(50);
    expect(calculatePercentageChange(200, 100)).toBe(-50);
  });

  it('handles zero old value', () => {
    expect(calculatePercentageChange(0, 100)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });
});

describe('roundTo', () => {
  it('rounds to specified decimal places', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.14159, 0)).toBe(3);
    expect(roundTo(3.145, 2)).toBe(3.15);
  });
});

describe('clamp', () => {
  it('clamps within range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('inRange', () => {
  it('checks if number is in range', () => {
    expect(inRange(5, 1, 10)).toBe(true);
    expect(inRange(0, 1, 10)).toBe(false);
    expect(inRange(10, 1, 10)).toBe(true);
  });
});

describe('safeParseNumber', () => {
  it('parses valid numbers', () => {
    expect(safeParseNumber('42')).toBe(42);
    expect(safeParseNumber('3.14')).toBe(3.14);
    expect(safeParseNumber(99)).toBe(99);
  });

  it('returns default for invalid input', () => {
    expect(safeParseNumber('abc')).toBe(0);
    expect(safeParseNumber('abc', 10)).toBe(10);
  });
});

describe('formatCompactNumber', () => {
  it('formats numbers with K/M/B suffixes', () => {
    expect(formatCompactNumber(500)).toBe('500');
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(1500000)).toBe('1.5M');
    expect(formatCompactNumber(2500000000)).toBe('2.5B');
  });
});

describe('formatCurrency', () => {
  it('formats INR amounts in full notation by default', () => {
    const result = formatCurrency(365783.28);
    // Expect the formatted string to contain the amount digits
    expect(result).toMatch(/3,65,783/);
  });

  it('formats INR in compact notation when compact=true', () => {
    expect(formatCurrency(365783.28, 'INR', { compact: true })).toBe('₹3.66L');
    expect(formatCurrency(10000000, 'INR', { compact: true })).toBe('₹1.00Cr');
    expect(formatCurrency(5000, 'INR', { compact: true })).toBe('₹5.00K');
    expect(formatCurrency(500, 'INR', { compact: true })).toBe('₹500.00');
  });

  it('supports legacy string locale argument', () => {
    const result = formatCurrency(1000, 'INR', 'en-IN');
    expect(result).toContain('1,000');
  });
});

describe('formatCurrencyCompact', () => {
  it('uses Indian short-scale suffixes', () => {
    expect(formatCurrencyCompact(1_00_00_000)).toBe('₹1.00Cr'); // 1 crore
    expect(formatCurrencyCompact(3_66_000)).toBe('₹3.66L'); // 3.66 lakh
    expect(formatCurrencyCompact(50_000)).toBe('₹50.00K'); // 50 thousand
    expect(formatCurrencyCompact(999)).toBe('₹999.00'); // plain
  });

  it('handles negative amounts correctly', () => {
    expect(formatCurrencyCompact(-5_00_000)).toBe('-₹5.00L');
    expect(formatCurrencyCompact(-1500)).toBe('-₹1.50K');
  });

  it('respects custom decimal places', () => {
    expect(formatCurrencyCompact(1_00_000, 0)).toBe('₹1L');
    expect(formatCurrencyCompact(1_50_000, 1)).toBe('₹1.5L');
  });
});

describe('formatPercent', () => {
  it('formats positive percentage with + prefix', () => {
    expect(formatPercent(12.5)).toBe('+12.50%');
    // Zero is displayed neutrally – no + prefix
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('formats negative percentage without + prefix', () => {
    expect(formatPercent(-3.25)).toBe('-3.25%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercent(7.1234, 1)).toBe('+7.1%');
    expect(formatPercent(-1.9876, 0)).toBe('-2%');
  });
});
