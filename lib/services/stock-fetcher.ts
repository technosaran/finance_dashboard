import { fetchWithTimeout } from './api';
import { logError, logWarn } from '../utils/logger';
import { fetchGoogleFinancePrice } from './google-finance';

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  currency: string;
  exchange: string;
  displayName?: string;
}

const YAHOO_ENDPOINTS = [
  'https://query1.finance.yahoo.com/v8/finance/chart/',
  'https://query2.finance.yahoo.com/v8/finance/chart/',
  'https://query1.finance.yahoo.com/v7/finance/quote?symbols=',
  'https://query2.finance.yahoo.com/v7/finance/quote?symbols=',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
];

/**
 * Fetch stock quote with multiple fallbacks and providers to bypass rate limits
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  const sanitizedSymbol = symbol.trim().toUpperCase();
  const nseSymbol = sanitizedSymbol.endsWith('.NS') ? sanitizedSymbol : `${sanitizedSymbol}.NS`;

  // 1. Try Yahoo Finance (NSE then BSE)
  for (const endpoint of YAHOO_ENDPOINTS) {
    try {
      const isQuoteEndpoint = endpoint.includes('/v7/finance/quote');
      const targetSymbol = nseSymbol; // Try NSE first

      const url = isQuoteEndpoint
        ? `${endpoint}${targetSymbol}`
        : `${endpoint}${targetSymbol}?interval=1d&range=1d`;

      const response = await fetchWithTimeout(
        url,
        {
          headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] },
        },
        5000
      );

      if (response.ok) {
        const data = await response.json();
        if (isQuoteEndpoint) {
          const result = data.quoteResponse?.result?.[0];
          if (result && result.regularMarketPrice) {
            return {
              symbol: sanitizedSymbol,
              currentPrice: result.regularMarketPrice,
              previousClose: result.regularMarketPreviousClose || 0,
              currency: result.currency || 'INR',
              exchange: 'NSE',
              displayName: result.shortName || sanitizedSymbol,
            };
          }
        } else {
          const result = data.chart?.result?.[0];
          if (result && result.meta?.regularMarketPrice) {
            return {
              symbol: sanitizedSymbol,
              currentPrice: result.meta.regularMarketPrice,
              previousClose: result.meta.previousClose || 0,
              currency: result.meta.currency || 'INR',
              exchange: 'NSE',
            };
          }
        }
      }
    } catch (_err) {
      logWarn(`Yahoo fetch failed for ${sanitizedSymbol} on ${endpoint}`);
    }
  }

  // 2. Fallback to Google Finance (NSE then BSE)
  try {
    let googleData = await fetchGoogleFinancePrice(sanitizedSymbol, 'NSE');
    if (!googleData) googleData = await fetchGoogleFinancePrice(sanitizedSymbol, 'BSE');

    if (googleData && googleData.price > 0) {
      return {
        symbol: sanitizedSymbol,
        currentPrice: googleData.price,
        previousClose: googleData.previousClose,
        currency: 'INR',
        exchange: 'GOOGLE',
      };
    }
  } catch (err) {
    logError(`Google Finance fallback failed for ${sanitizedSymbol}`, err);
  }

  return null;
}

/**
 * Batch fetch with fallbacks
 */
export async function fetchBatchStockQuotes(
  symbols: string[]
): Promise<Record<string, StockQuote>> {
  const results: Record<string, StockQuote> = {};
  // Try bulk Yahoo quote first as it's efficient
  const nseList = symbols.map((s) => (s.includes('.') ? s : `${s}.NS`)).join(',');
  const bseList = symbols.map((s) => (s.includes('.') ? s : `${s}.BO`)).join(',');

  for (const endpoint of [YAHOO_ENDPOINTS[2], YAHOO_ENDPOINTS[3]]) {
    try {
      const response = await fetchWithTimeout(
        `${endpoint}${nseList},${bseList}`,
        {
          headers: { 'User-Agent': USER_AGENTS[0] },
        },
        8000
      );

      if (response.ok) {
        const data = await response.json();
        if (data.quoteResponse?.result) {
          for (const quote of data.quoteResponse.result) {
            const baseSym = quote.symbol.split('.')[0];
            if (quote.regularMarketPrice) {
              results[baseSym] = {
                symbol: baseSym,
                currentPrice: quote.regularMarketPrice,
                previousClose: quote.regularMarketPreviousClose || 0,
                currency: quote.currency || 'INR',
                exchange: quote.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
                displayName: quote.shortName || baseSym,
              };
            }
          }
        }
      }
    } catch (err) {
      logWarn(`Bulk Yahoo fetch failed: ${err}`);
    }
  }

  // Individual fallbacks for missing symbols
  const missing = symbols.filter((s) => !results[s]);
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (s) => {
        const quote = await fetchStockQuote(s);
        if (quote) results[s] = quote;
      })
    );
  }

  return results;
}
