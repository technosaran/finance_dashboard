import { arrayToCSV } from '@/lib/utils/export';

describe('arrayToCSV', () => {
  it('returns empty string for empty array', () => {
    expect(arrayToCSV([])).toBe('');
  });

  it('generates CSV with headers from object keys', () => {
    const data = [{ name: 'Alice', amount: 100 }];
    const result = arrayToCSV(data);
    expect(result).toBe('name,amount\nAlice,100');
  });

  it('uses custom headers when provided', () => {
    const data = [{ name: 'Bob', amount: 200, extra: 'ignored' }];
    const result = arrayToCSV(data, ['name', 'amount']);
    expect(result).toBe('name,amount\nBob,200');
  });

  it('escapes values containing commas', () => {
    const data = [{ desc: 'hello, world', value: 1 }];
    const result = arrayToCSV(data);
    expect(result).toContain('"hello, world"');
  });

  it('escapes values containing double quotes', () => {
    const data = [{ desc: 'say "hi"', value: 1 }];
    const result = arrayToCSV(data);
    expect(result).toContain('"say ""hi"""');
  });

  it('escapes values containing newlines', () => {
    const data = [{ desc: 'line1\nline2', value: 1 }];
    const result = arrayToCSV(data);
    expect(result).toContain('"line1\nline2"');
  });

  it('handles null and undefined values', () => {
    const data = [{ a: null, b: undefined }] as Array<Record<string, unknown>>;
    const result = arrayToCSV(data);
    expect(result).toBe('a,b\n,');
  });
});
