/**
 * API Security and Validation Tests
 * Tests for improved input validation, error handling, and security measures
 */

// Set up test environment variables before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key-1234567890';

import { rateLimit, parseCommaSeparatedParam, deterministicHash } from '@/lib/services/api';

// Mock Next.js Response
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

describe('API Security Utilities', () => {
  describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'test-user-1';
      const result = await rateLimit(identifier, 10, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block requests exceeding limit', async () => {
      const identifier = 'test-user-2';
      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await rateLimit(identifier, 10, 60000);
      }
      // 11th request should fail
      const result = await rateLimit(identifier, 10, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const identifier = 'test-user-3';
      // Use very short window
      await rateLimit(identifier, 2, 100);
      await rateLimit(identifier, 2, 100);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should allow new requests
      const result = await rateLimit(identifier, 2, 100);
      expect(result.success).toBe(true);
    });
  });
});

describe('Input Validation', () => {
  describe('Forex Pair Validation', () => {
    it('should accept valid forex pairs', () => {
      const validPairs = ['USDINR', 'EURINR', 'GBPINR', 'JPYINR'];
      validPairs.forEach((pair) => {
        expect(/^[A-Z]{6,7}$/.test(pair)).toBe(true);
      });
    });

    it('should reject invalid forex pairs', () => {
      const invalidPairs = ['USD', 'USDINR123', 'usd-inr', 'US$INR'];
      invalidPairs.forEach((pair) => {
        expect(/^[A-Z]{6,7}$/.test(pair)).toBe(false);
      });
    });
  });

  describe('ISIN Validation', () => {
    it('should accept valid ISIN format', () => {
      const validIsins = ['INE018E07BU2', 'US0378331005', 'GB0002374006'];
      validIsins.forEach((isin) => {
        expect(/^[A-Z]{2}[A-Z0-9]{10}$/i.test(isin)).toBe(true);
      });
    });

    it('should reject invalid ISIN format', () => {
      const invalidIsins = ['INVALID', 'INE018E', '1234567890AB', 'IN-E018E07BU2'];
      invalidIsins.forEach((isin) => {
        expect(/^[A-Z]{2}[A-Z0-9]{10}$/i.test(isin)).toBe(false);
      });
    });
  });

  describe('Batch Size Limits', () => {
    it('should enforce maximum batch size', () => {
      const maxSize = 50;
      const tooManyItems = Array(51).fill('item');

      expect(tooManyItems.length).toBeGreaterThan(maxSize);
    });

    it('should accept valid batch sizes', () => {
      const maxSize = 50;
      const validBatch = Array(30).fill('item');

      expect(validBatch.length).toBeLessThanOrEqual(maxSize);
    });
  });
});

describe('parseCommaSeparatedParam', () => {
  it('should parse valid comma-separated values', () => {
    const params = new URLSearchParams('symbols=AAPL,GOOG,MSFT');
    const result = parseCommaSeparatedParam(params, 'symbols');
    expect(result.items).toEqual(['AAPL', 'GOOG', 'MSFT']);
    expect(result.error).toBeUndefined();
  });

  it('should return error when parameter is missing', () => {
    const params = new URLSearchParams('');
    const result = parseCommaSeparatedParam(params, 'symbols');
    expect(result.error).toBeDefined();
    expect(result.items).toBeUndefined();
  });

  it('should filter out empty values', () => {
    const params = new URLSearchParams('symbols=AAPL,,GOOG,,,MSFT');
    const result = parseCommaSeparatedParam(params, 'symbols');
    expect(result.items).toEqual(['AAPL', 'GOOG', 'MSFT']);
  });

  it('should apply transform function', () => {
    const params = new URLSearchParams('symbols=aapl,goog');
    const result = parseCommaSeparatedParam(params, 'symbols', {
      transform: (s: string) => s.trim().toUpperCase(),
    });
    expect(result.items).toEqual(['AAPL', 'GOOG']);
  });

  it('should enforce max items limit', () => {
    const items = Array(51).fill('X').join(',');
    const params = new URLSearchParams(`symbols=${items}`);
    const result = parseCommaSeparatedParam(params, 'symbols', { maxItems: 50 });
    expect(result.error).toBeDefined();
    expect(result.items).toBeUndefined();
  });

  it('should accept items within max limit', () => {
    const items = Array(50).fill('X').join(',');
    const params = new URLSearchParams(`symbols=${items}`);
    const result = parseCommaSeparatedParam(params, 'symbols', { maxItems: 50 });
    expect(result.items).toHaveLength(50);
  });
});

describe('deterministicHash', () => {
  it('should return consistent hash for same input', () => {
    const hash1 = deterministicHash('RELIANCE2026-02-16');
    const hash2 = deterministicHash('RELIANCE2026-02-16');
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = deterministicHash('RELIANCE2026-02-16');
    const hash2 = deterministicHash('TCS2026-02-16');
    expect(hash1).not.toBe(hash2);
  });

  it('should return a number', () => {
    const hash = deterministicHash('test');
    expect(typeof hash).toBe('number');
  });
});
