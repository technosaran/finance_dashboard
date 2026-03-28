import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCachedOrFetch,
  parseCommaSeparatedParam,
} from '@/lib/services/api';
import { logError } from '@/lib/utils/logger';

interface StockBatchQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  currency: string;
  exchange: string;
  displayName?: string;
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

  const normalizedSymbols = [...symbols].sort();
  const cacheKey = `batch_stocks_${normalizedSymbols.join(',')}`;

  try {
    const result = await getCachedOrFetch<Record<string, StockBatchQuote>>(
      cacheKey,
      async () => {
        const { fetchBatchStockQuotes } = await import('@/lib/services/stock-fetcher');
        return fetchBatchStockQuotes(normalizedSymbols);
      },
      30000
    );
    return createSuccessResponse(result);
  } catch (error) {
    logError('Batch stock quote service failed', error, { symbols: normalizedSymbols.join(',') });
    return createErrorResponse('Failed to fetch batch quotes. Please try again.', 500);
  }
}

export const GET = withErrorHandling(handleBatchQuote);
