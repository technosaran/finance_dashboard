import { calculateApproxBondYield } from '@/lib/utils/bonds';

export type BondType = 'Corporate' | 'SGB' | 'Govt';

export interface BondCatalogItem {
  isin: string;
  name: string;
  type: BondType;
  issuer: string;
  coupon: number;
  maturity: string;
  faceValue: number;
  exchange: string;
}

export interface BondSearchResult {
  symbol: string;
  companyName: string;
  issuer: string;
  name: string;
  type: BondType;
  couponRate: number;
  maturityDate: string;
}

export interface BondQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  couponRate: number;
  maturityDate: string;
  companyName: string;
  name: string;
  exchange: string;
  faceValue: number;
  type: BondType;
  yieldToMaturity: number | null;
}

export const BOND_CATALOG: BondCatalogItem[] = [
  {
    isin: 'IN0020230085',
    name: 'NHAI 7.9% 2035',
    type: 'Corporate',
    issuer: 'National Highways Authority of India',
    coupon: 7.9,
    maturity: '2035-10-15',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020210160',
    name: 'NHAI 7.39% 2031',
    type: 'Corporate',
    issuer: 'National Highways Authority of India',
    coupon: 7.39,
    maturity: '2031-11-20',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220037',
    name: 'REC 7.54% 2032',
    type: 'Corporate',
    issuer: 'Rural Electrification Corporation',
    coupon: 7.54,
    maturity: '2032-12-30',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230150',
    name: 'PFC 7.6% 2033',
    type: 'Corporate',
    issuer: 'Power Finance Corporation',
    coupon: 7.6,
    maturity: '2033-04-15',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220193',
    name: 'IRFC 7.4% 2034',
    type: 'Corporate',
    issuer: 'Indian Railway Finance Corporation',
    coupon: 7.4,
    maturity: '2034-08-25',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020210210',
    name: 'SBI 7.72% 2036',
    type: 'Corporate',
    issuer: 'State Bank of India Tier 2',
    coupon: 7.72,
    maturity: '2036-09-05',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230093',
    name: 'NABARD 7.6% 2033',
    type: 'Corporate',
    issuer: 'National Bank for Agriculture',
    coupon: 7.6,
    maturity: '2033-07-20',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220250',
    name: 'HDFC 7.8% 2032',
    type: 'Corporate',
    issuer: 'HDFC Bank Ltd.',
    coupon: 7.8,
    maturity: '2032-11-15',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230283',
    name: 'RELIANCE 7.9% 2033',
    type: 'Corporate',
    issuer: 'Reliance Industries Ltd.',
    coupon: 7.9,
    maturity: '2033-10-10',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220318',
    name: 'L&T 7.7% 2032',
    type: 'Corporate',
    issuer: 'Larsen & Toubro Ltd.',
    coupon: 7.7,
    maturity: '2032-05-25',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020200294',
    name: 'SGB Series I 2028',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2028-04-20',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020200344',
    name: 'SGB Series II 2028',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2028-05-15',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020210087',
    name: 'SGB Series I 2029',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2029-05-18',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020210145',
    name: 'SGB Series II 2029',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2029-06-08',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220052',
    name: 'SGB Series I 2030',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2030-06-20',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220128',
    name: 'SGB Series II 2030',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2030-08-11',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230028',
    name: 'SGB Series I 2031',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2031-06-15',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230069',
    name: 'SGB Series II 2031',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2031-08-12',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230242',
    name: 'SGB Series III 2031',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2031-10-25',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020240019',
    name: 'SGB Series IV 2032',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2032-02-14',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020200039',
    name: 'GOI 6.1% 2031',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 6.1,
    maturity: '2031-07-12',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020210095',
    name: 'GOI 6.54% 2032',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 6.54,
    maturity: '2032-01-17',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020220102',
    name: 'GOI 7.26% 2033',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 7.26,
    maturity: '2033-02-06',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020230184',
    name: 'GOI 7.18% 2033',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 7.18,
    maturity: '2033-08-14',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020240043',
    name: 'GOI 7.1% 2034',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 7.1,
    maturity: '2034-04-10',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020200153',
    name: 'GOI 7.18% 2037',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 7.18,
    maturity: '2037-08-25',
    faceValue: 1000,
    exchange: 'NSE',
  },
  {
    isin: 'IN0020210186',
    name: 'GOI 7.30% 2053',
    type: 'Govt',
    issuer: 'Government of India',
    coupon: 7.3,
    maturity: '2053-06-19',
    faceValue: 1000,
    exchange: 'NSE',
  },
];

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index++) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

function scoreBondMatch(bond: BondCatalogItem, query: string): number {
  const normalizedQuery = query.toUpperCase();
  let score = 0;

  if (bond.isin === normalizedQuery) score += 2000;
  if (bond.name.toUpperCase() === normalizedQuery) score += 1500;
  if (bond.issuer.toUpperCase() === normalizedQuery) score += 1200;
  if (bond.name.toUpperCase().startsWith(normalizedQuery)) score += 800;
  if (bond.issuer.toUpperCase().startsWith(normalizedQuery)) score += 650;
  if (bond.name.toUpperCase().includes(normalizedQuery)) score += 400;
  if (bond.issuer.toUpperCase().includes(normalizedQuery)) score += 350;
  if (bond.type.toUpperCase().includes(normalizedQuery)) score += 150;

  if (normalizedQuery.includes('%') && bond.name.toUpperCase().includes(normalizedQuery)) {
    score += 100;
  }

  return score;
}

function createSyntheticIsin(seed: string): string {
  return `IN${(hashSeed(seed) % 10_000_000_000).toString().padStart(10, '0')}`;
}

function createSyntheticBond(query: string): BondCatalogItem {
  const normalizedQuery = query.toUpperCase();
  const hash = hashSeed(normalizedQuery);
  const coupon = Number((6.5 + (hash % 18) * 0.1).toFixed(2));
  const maturityYear = 2030 + (hash % 8);
  const maturityMonth = (hash % 12) + 1;
  const maturityDay = ((Math.floor(hash / 13) % 28) + 1).toString().padStart(2, '0');
  const maturity = `${maturityYear}-${padTwoDigits(maturityMonth)}-${maturityDay}`;
  const isin = ISIN_PATTERN.test(normalizedQuery)
    ? normalizedQuery
    : createSyntheticIsin(normalizedQuery);

  return {
    isin,
    name: ISIN_PATTERN.test(normalizedQuery)
      ? `Bond ${normalizedQuery}`
      : `${normalizedQuery} ${coupon}% ${maturityYear}`,
    type: 'Corporate',
    issuer: 'Custom Bond Entry',
    coupon,
    maturity,
    faceValue: 1000,
    exchange: 'NSE',
  };
}

function formatBondSearchResult(bond: BondCatalogItem): BondSearchResult {
  return {
    symbol: bond.isin,
    companyName: `${bond.name} - ${bond.issuer}`,
    issuer: bond.issuer,
    name: bond.name,
    type: bond.type,
    couponRate: bond.coupon,
    maturityDate: bond.maturity,
  };
}

function resolveBondFromIdentifier(identifier: string): BondCatalogItem {
  const normalizedIdentifier = identifier.trim().toUpperCase();

  const exactMatch =
    BOND_CATALOG.find((bond) => bond.isin === normalizedIdentifier) ||
    BOND_CATALOG.find((bond) => bond.name.toUpperCase() === normalizedIdentifier) ||
    BOND_CATALOG.find((bond) => bond.issuer.toUpperCase() === normalizedIdentifier);

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = BOND_CATALOG.map((bond) => ({
    bond,
    score: scoreBondMatch(bond, normalizedIdentifier),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.bond;

  return partialMatch || createSyntheticBond(normalizedIdentifier);
}

export function searchBondCatalog(query: string): BondSearchResult[] {
  const normalizedQuery = query.trim().toUpperCase();

  const rankedResults = BOND_CATALOG.map((bond) => ({
    bond,
    score: scoreBondMatch(bond, normalizedQuery),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.bond.name.localeCompare(right.bond.name);
    })
    .slice(0, 10)
    .map((item) => formatBondSearchResult(item.bond));

  if (rankedResults.length > 0) {
    return rankedResults;
  }

  if (normalizedQuery.length < 4) {
    return [];
  }

  return [formatBondSearchResult(createSyntheticBond(normalizedQuery))];
}

export function getBondQuote(identifier: string): BondQuote {
  const bond = resolveBondFromIdentifier(identifier);
  const priceHash = hashSeed(`bond-price:${bond.isin}`);
  const dayHash = hashSeed(`bond-day:${bond.isin}`);
  const premiumOffset = (priceHash % 81) - 40;
  const couponPremium = Math.round((bond.coupon - 7) * 14);
  const currentPrice = Number((bond.faceValue + premiumOffset + couponPremium).toFixed(2));
  const previousClose = Number(
    Math.max(currentPrice - ((dayHash % 11) - 5) * 0.45, bond.faceValue * 0.85).toFixed(2)
  );

  return {
    symbol: bond.isin,
    currentPrice,
    previousClose,
    couponRate: bond.coupon,
    maturityDate: bond.maturity,
    companyName: bond.issuer,
    name: bond.name,
    exchange: bond.exchange,
    faceValue: bond.faceValue,
    type: bond.type,
    yieldToMaturity: calculateApproxBondYield({
      currentPrice,
      couponRate: bond.coupon,
      maturityDate: bond.maturity,
      faceValue: bond.faceValue,
    }),
  };
}
