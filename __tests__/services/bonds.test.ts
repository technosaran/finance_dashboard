import { BOND_CATALOG, getBondQuote, searchBondCatalog } from '@/lib/services/bonds';

describe('bond service', () => {
  it('keeps catalog ISINs unique so search and quote stay aligned', () => {
    const uniqueIsins = new Set(BOND_CATALOG.map((bond) => bond.isin));
    expect(uniqueIsins.size).toBe(BOND_CATALOG.length);
  });

  it('returns searchable bond results with quote-ready identifiers', () => {
    const results = searchBondCatalog('IRFC');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      symbol: 'IN0020220193',
      name: 'IRFC 7.4% 2034',
      issuer: 'Indian Railway Finance Corporation',
      couponRate: 7.4,
      maturityDate: '2034-08-25',
    });
  });

  it('returns full quote details for catalog bonds that were previously missing from the quote route', () => {
    const quote = getBondQuote('IN0020220193');
    expect(quote).toMatchObject({
      symbol: 'IN0020220193',
      name: 'IRFC 7.4% 2034',
      companyName: 'Indian Railway Finance Corporation',
      couponRate: 7.4,
      maturityDate: '2034-08-25',
      exchange: 'NSE',
      type: 'Corporate',
    });
    expect(quote.currentPrice).toBeGreaterThan(0);
    expect(quote.previousClose).toBeGreaterThan(0);
  });

  it('creates deterministic synthetic search and quote data for custom identifiers', () => {
    const [syntheticResult] = searchBondCatalog('CUSTOM 2032');
    const firstQuote = getBondQuote('CUSTOM 2032');
    const secondQuote = getBondQuote('CUSTOM 2032');

    expect(syntheticResult.symbol).toMatch(/^IN[A-Z0-9]{10}$/);
    expect(firstQuote.symbol).toBe(secondQuote.symbol);
    expect(firstQuote.currentPrice).toBe(secondQuote.currentPrice);
    expect(firstQuote.maturityDate).toBe(secondQuote.maturityDate);
  });
});
