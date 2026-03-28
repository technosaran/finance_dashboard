import { fetchWithTimeout, getCachedOrFetch } from '@/lib/services/api';

const AMFI_CURRENT_FEED_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';
const AMFI_HISTORY_FEED_URL = 'https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx';

const CURRENT_FEED_CACHE_KEY = 'amfi_current_feed_v1';
const CURRENT_FEED_TTL_MS = 30 * 60 * 1000;
const HISTORY_FEED_TTL_MS = 15 * 60 * 1000;
const HISTORY_LOOKBACK_DAYS = 7;

export interface MutualFundSearchItem {
  schemeCode: string;
  schemeName: string;
  category: string;
  shortName: string;
  isDirectPlan: boolean;
}

export interface MutualFundQuoteItem {
  schemeCode: string;
  schemeName: string;
  category: string;
  currentNav: number;
  previousNav: number;
  date: string;
  isin?: string;
  isDirectPlan: boolean;
}

interface ParsedSchemeRow {
  schemeCode: string;
  schemeName: string;
  shortName: string;
  category: string;
  currentNav: number;
  date: string;
  isin?: string;
  isDirectPlan: boolean;
  isGrowthPlan: boolean;
}

interface NavEntry {
  nav: number;
  date: string;
}

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const monthMap: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

const parseAmfiDate = (value: string): number => {
  const trimmed = normalizeText(value);
  const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return 0;

  const day = Number(match[1]);
  const month = monthMap[match[2].toUpperCase()] ?? 0;
  const year = Number(match[3]);
  return new Date(Date.UTC(year, month, day)).getTime();
};

const formatAmfiDate = (date: Date) =>
  date
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replace(/ /g, '-');

const formatShortName = (schemeName: string) =>
  normalizeText(
    schemeName
      .replace(/\s*-\s*DIRECT\b/gi, ' Direct')
      .replace(/\s*-\s*REGULAR\b/gi, ' Regular')
      .replace(/\s+PLAN\b/gi, '')
      .replace(/\bIDCW\b/gi, 'IDCW')
  );

const parseCurrentFeed = (rawFeed: string): ParsedSchemeRow[] => {
  const lines = rawFeed.split(/\r?\n/);
  const rows: ParsedSchemeRow[] = [];
  let currentCategory = 'Mutual Fund';

  for (const rawLine of lines) {
    const line = normalizeText(rawLine);
    if (!line) continue;

    if (/^scheme code;/i.test(line)) continue;

    if (!line.includes(';')) {
      if (/schemes/i.test(line)) {
        currentCategory = line;
      }
      continue;
    }

    if (!/^\d+;/.test(line)) continue;

    const parts = line.split(';');
    if (parts.length < 6) continue;

    const schemeCode = normalizeText(parts[0]);
    const isinGrowth = normalizeText(parts[1] || '');
    const isinReinvestment = normalizeText(parts[2] || '');
    const schemeName = normalizeText(parts[3] || '');
    const currentNav = Number.parseFloat(parts[4] || '');
    const date = normalizeText(parts[5] || '');

    if (!schemeCode || !schemeName || Number.isNaN(currentNav) || !date) continue;

    rows.push({
      schemeCode,
      schemeName,
      shortName: formatShortName(schemeName),
      category: currentCategory,
      currentNav,
      date,
      isin: isinGrowth || isinReinvestment || undefined,
      isDirectPlan: /\bdirect\b/i.test(schemeName),
      isGrowthPlan: /\bgrowth\b/i.test(schemeName),
    });
  }

  return rows;
};

const parseHistoryFeed = (rawFeed: string, codes: Set<string>) => {
  const historyMap = new Map<string, NavEntry[]>();
  const lines = rawFeed.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = normalizeText(rawLine);
    if (!line || !/^\d+;/.test(line)) continue;

    const parts = line.split(';');
    if (parts.length < 8) continue;

    const schemeCode = normalizeText(parts[0]);
    if (!codes.has(schemeCode)) continue;

    const nav = Number.parseFloat(parts[4] || '');
    const date = normalizeText(parts[7] || '');
    if (Number.isNaN(nav) || !date) continue;

    const entries = historyMap.get(schemeCode) || [];
    entries.push({ nav, date });
    historyMap.set(schemeCode, entries);
  }

  for (const [code, entries] of historyMap.entries()) {
    const deduped = new Map<string, NavEntry>();
    for (const entry of entries) {
      if (!deduped.has(entry.date)) {
        deduped.set(entry.date, entry);
      }
    }

    historyMap.set(
      code,
      Array.from(deduped.values()).sort((a, b) => parseAmfiDate(b.date) - parseAmfiDate(a.date))
    );
  }

  return historyMap;
};

const fetchCurrentFeed = async (): Promise<ParsedSchemeRow[]> => {
  return getCachedOrFetch(
    CURRENT_FEED_CACHE_KEY,
    async () => {
      const response = await fetchWithTimeout(
        AMFI_CURRENT_FEED_URL,
        {
          headers: {
            Accept: 'text/plain, text/html;q=0.9,*/*;q=0.8',
          },
        },
        12000
      );

      if (!response.ok) {
        throw new Error(`AMFI current feed failed with status ${response.status}`);
      }

      return parseCurrentFeed(await response.text());
    },
    CURRENT_FEED_TTL_MS
  );
};

const fetchHistoryFeed = async (codes: string[]): Promise<Map<string, NavEntry[]>> => {
  const uniqueCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))].sort();
  const cacheKey = `amfi_history_v1_${uniqueCodes.join(',')}`;
  const cachedEntries = await getCachedOrFetch(
    cacheKey,
    async () => {
      const fromDate = new Date();
      fromDate.setUTCDate(fromDate.getUTCDate() - HISTORY_LOOKBACK_DAYS);
      const toDate = new Date();

      const historyUrl = `${AMFI_HISTORY_FEED_URL}?frmdt=${encodeURIComponent(
        formatAmfiDate(fromDate)
      )}&todt=${encodeURIComponent(formatAmfiDate(toDate))}`;

      const response = await fetchWithTimeout(
        historyUrl,
        {
          headers: {
            Accept: 'text/plain, text/html;q=0.9,*/*;q=0.8',
          },
        },
        15000
      );

      if (!response.ok) {
        throw new Error(`AMFI history feed failed with status ${response.status}`);
      }

      const parsed = parseHistoryFeed(await response.text(), new Set(uniqueCodes));
      return Array.from(parsed.entries());
    },
    HISTORY_FEED_TTL_MS
  );

  return new Map(cachedEntries);
};

const buildSearchScore = (item: ParsedSchemeRow, query: string) => {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const name = item.schemeName.toLowerCase();
  const code = item.schemeCode.toLowerCase();

  let score = 0;
  if (code === normalizedQuery) score += 2000;
  if (name === normalizedQuery) score += 1500;
  if (name.startsWith(normalizedQuery)) score += 900;
  if (name.includes(normalizedQuery)) score += 500;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  for (const token of tokens) {
    if (name.includes(token) || code.includes(token)) {
      score += 120;
    } else {
      score -= 75;
    }
  }

  if (item.isDirectPlan) score += 80;
  if (item.isGrowthPlan) score += 25;
  if (/\bregular\b/i.test(item.schemeName)) score -= 30;
  if (/\bidcw\b|\bdividend\b/i.test(item.schemeName)) score -= 10;

  return score;
};

export const searchMutualFunds = async (query: string): Promise<MutualFundSearchItem[]> => {
  const rows = await fetchCurrentFeed();
  const normalizedQuery = normalizeText(query).toLowerCase();
  const ranked = rows
    .map((row) => ({ row, score: buildSearchScore(row, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.row.isDirectPlan !== b.row.isDirectPlan) return a.row.isDirectPlan ? -1 : 1;
      if (a.row.isGrowthPlan !== b.row.isGrowthPlan) return a.row.isGrowthPlan ? -1 : 1;
      return a.row.schemeName.localeCompare(b.row.schemeName);
    });

  const prefersCoinResults =
    !/^\d+$/.test(normalizedQuery) && !/\bregular\b|\bidcw\b|\bdividend\b/.test(normalizedQuery);

  const directOnly = ranked.filter((item) => item.row.isDirectPlan);
  const resultPool = prefersCoinResults && directOnly.length > 0 ? directOnly : ranked;

  return resultPool.slice(0, 20).map(({ row }) => ({
    schemeCode: row.schemeCode,
    schemeName: row.schemeName,
    category: row.category,
    shortName: row.shortName,
    isDirectPlan: row.isDirectPlan,
  }));
};

export const getMutualFundQuotes = async (
  codes: string[]
): Promise<Record<string, MutualFundQuoteItem>> => {
  const uniqueCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))];
  if (uniqueCodes.length === 0) return {};

  const rows = await fetchCurrentFeed();
  const historyMap = await fetchHistoryFeed(uniqueCodes);
  const currentMap = new Map(rows.map((row) => [row.schemeCode, row]));

  return uniqueCodes.reduce<Record<string, MutualFundQuoteItem>>((acc, code) => {
    const current = currentMap.get(code);
    const history = historyMap.get(code) || [];
    const mergedEntries = [
      ...(current
        ? [
            {
              nav: current.currentNav,
              date: current.date,
            },
          ]
        : []),
      ...history,
    ];

    const deduped = new Map<string, NavEntry>();
    for (const entry of mergedEntries) {
      if (!deduped.has(entry.date)) {
        deduped.set(entry.date, entry);
      }
    }

    const orderedEntries = Array.from(deduped.values()).sort(
      (a, b) => parseAmfiDate(b.date) - parseAmfiDate(a.date)
    );

    if (!current && orderedEntries.length === 0) {
      return acc;
    }

    const latest = orderedEntries[0] || {
      nav: current?.currentNav || 0,
      date: current?.date || '',
    };
    const previous = orderedEntries[1] || latest;

    acc[code] = {
      schemeCode: code,
      schemeName: current?.schemeName || code,
      category: current?.category || 'Mutual Fund',
      currentNav: Number(latest.nav.toFixed(4)),
      previousNav: Number(previous.nav.toFixed(4)),
      date: latest.date,
      isin: current?.isin,
      isDirectPlan: current?.isDirectPlan ?? /\bdirect\b/i.test(current?.schemeName || ''),
    };

    return acc;
  }, {});
};

export const getMutualFundQuote = async (code: string): Promise<MutualFundQuoteItem | null> => {
  const quotes = await getMutualFundQuotes([code]);
  return quotes[code] || null;
};
