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

// Simple local cache for symbols within the same instance lifetime
const symbolCache = new Map<string, { data: StockQuote; timestamp: number }>();
const SYMBOL_CACHE_TTL = 30000; // 30 seconds

/**
 * Fetch stock quote with multiple fallbacks and providers to bypass rate limits
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  const sanitizedSymbol = symbol.trim().toUpperCase();

  // Check local cache first
  const cached = symbolCache.get(sanitizedSymbol);
  if (cached && Date.now() - cached.timestamp < SYMBOL_CACHE_TTL) {
    return cached.data;
  }

  const nseSymbol = sanitizedSymbol.endsWith('.NS') ? sanitizedSymbol : `${sanitizedSymbol}.NS`;
  const bseSymbol = nseSymbol.replace('.NS', '.BO');

  // 1. Try Yahoo Finance (NSE then BSE)
  const symbolsToTry = [nseSymbol, bseSymbol];

  for (const targetSymbol of symbolsToTry) {
    for (const endpoint of YAHOO_ENDPOINTS) {
      try {
        const isQuoteEndpoint = endpoint.includes('/v7/finance/quote');
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
          const result = isQuoteEndpoint
            ? data.quoteResponse?.result?.[0]
            : data.chart?.result?.[0];

          if (result) {
            const currentPrice = isQuoteEndpoint
              ? result.regularMarketPrice
              : result.meta?.regularMarketPrice;
            const previousClose = isQuoteEndpoint
              ? result.regularMarketPreviousClose
              : result.meta?.previousClose;

            if (currentPrice) {
              const quote: StockQuote = {
                symbol: sanitizedSymbol,
                currentPrice,
                previousClose: previousClose || 0,
                currency: (isQuoteEndpoint ? result.currency : result.meta?.currency) || 'INR',
                exchange: targetSymbol.endsWith('.NS') ? 'NSE' : 'BSE',
                displayName:
                  (isQuoteEndpoint ? result.shortName : result.meta?.symbol) || sanitizedSymbol,
              };
              symbolCache.set(sanitizedSymbol, { data: quote, timestamp: Date.now() });
              return quote;
            }
          }
        }
      } catch (_err) {
        logWarn(`Yahoo fetch failed for ${targetSymbol} on ${endpoint}`);
      }
    }
  }

  // 2. Fallback to Google Finance (NSE then BSE)
  try {
    let googleData = await fetchGoogleFinancePrice(sanitizedSymbol, 'NSE');
    if (!googleData) googleData = await fetchGoogleFinancePrice(sanitizedSymbol, 'BSE');

    if (googleData && googleData.price > 0) {
      const quote: StockQuote = {
        symbol: sanitizedSymbol,
        currentPrice: googleData.price,
        previousClose: googleData.previousClose,
        currency: 'INR',
        exchange: 'GOOGLE',
      };
      symbolCache.set(sanitizedSymbol, { data: quote, timestamp: Date.now() });
      return quote;
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
  if (symbols.length === 0) return results;

  // Prepare symbols for Yahoo Finance
  // Usually, we prefer NSE. So we try NSE symbols first in a batch.
  const nseOnly = symbols.map((s) => (s.includes('.') ? s : `${s}.NS`));
  const bseOnly = symbols.map((s) => (s.includes('.') ? s : `${s}.BO`));

  // Try bulk Yahoo quote for NSE first, then BSE for missing ones
  const batchLists = [nseOnly.join(','), bseOnly.join(',')];

  for (const list of batchLists) {
    for (const endpoint of [YAHOO_ENDPOINTS[2], YAHOO_ENDPOINTS[3]]) {
      try {
        const response = await fetchWithTimeout(
          `${endpoint}${list}`,
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
              // Only add if not already present (prefer NSE if we get it first)
              if (quote.regularMarketPrice && !results[baseSym]) {
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
        logWarn(`Bulk Yahoo fetch failed for list ${list.substring(0, 20)}...:`, { err });
      }
    }

    // If we have all symbols, don't bother trying other endpoints/lists
    if (Object.keys(results).length === symbols.length) break;
  }

  // Individual fallbacks for missing symbols
  const missing = symbols.filter((s) => !results[s]);
  if (missing.length > 0) {
    // Process missing symbols in smaller chunks to avoid hitting rate limits too hard
    const CHUNK_SIZE = 5;
    for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
      const chunk = missing.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (s) => {
          try {
            const quote = await fetchStockQuote(s);
            if (quote) {
              results[s] = quote;
            }
          } catch (err) {
            logError(`Fallback fetch failed for ${s}`, { err });
          }
        })
      );
    }
  }

  return results;
}
