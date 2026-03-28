import { NextResponse } from 'next/server';
import { validateStockQuery } from '@/lib/validators/input';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCachedOrFetch,
} from '@/lib/services/api';
import { logError } from '@/lib/utils/logger';

/**
 * Stock quote API endpoint with security enhancements
 */
async function handleStockQuote(request: Request): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return createErrorResponse('Symbol parameter is required', 400);
  }

  // Validate symbol
  const validation = validateStockQuery(symbol);
  if (!validation.isValid) {
    return createErrorResponse(validation.error || 'Invalid symbol', 400);
  }

  const cacheKey = `stock_quote_${symbol.trim().toUpperCase()}`;

  try {
    const sanitizedSymbol = symbol.trim().toUpperCase();
    const quoteData = await getCachedOrFetch(
      cacheKey,
      async () => {
        const { fetchStockQuote } = await import('@/lib/services/stock-fetcher');
        const result = await fetchStockQuote(sanitizedSymbol);
        if (!result) throw new Error('QUOTE_NOT_FOUND');
        return result;
      },
      60000
    );

    return createSuccessResponse(quoteData);
  } catch (error) {
    if (error instanceof Error && error.message === 'QUOTE_NOT_FOUND') {
      return createErrorResponse('Symbol not found in any of our providers', 404);
    }
    logError('Stock quote service failed', error, { symbol });
    return createErrorResponse('Failed to fetch stock quote. Please try again.', 500);
  }
}

export const GET = withErrorHandling(handleStockQuote);
