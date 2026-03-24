import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCache,
  setCache,
  parseCommaSeparatedParam,
} from '@/lib/services/api';
import { logError } from '@/lib/utils/logger';

interface StockBatchQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  currency: string;
  exchange: string;
  displayName: string;
}

/**
 * Batch stock quote API endpoint
 */
async function handleBatchQuote(request: Request): Promise<NextResponse> {
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const parsed = parseCommaSeparatedParam(searchParams, 'symbols', {
    transform: (s) => s.trim().toUpperCase(),
  });
  if (parsed.error) return parsed.error;
  const symbols = parsed.items;

  const cacheKey = `batch_stocks_${symbols.sort().join(',')}`;
  const cached = getCache<Record<string, StockBatchQuote>>(cacheKey);
  if (cached) return createSuccessResponse(cached);

  try {
    const { fetchBatchStockQuotes } = await import('@/lib/services/stock-fetcher');
    const result = await fetchBatchStockQuotes(symbols);

    setCache(cacheKey, result, 30000); // 30 seconds local cache
    return createSuccessResponse(result);
  } catch (error) {
    logError('Batch stock quote service failed', error, { symbols: symbols.join(',') });
    return createErrorResponse('Failed to fetch batch quotes. Please try again.', 500);
  }
}

export const GET = withErrorHandling(handleBatchQuote);
