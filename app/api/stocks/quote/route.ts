import { NextResponse } from 'next/server';
import { validateStockQuery } from '@/lib/validators/input';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCache,
  setCache,
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
  const cached = getCache<{
    symbol: string;
    currentPrice: number;
    previousClose: number;
    currency: string;
    exchange: string;
  }>(cacheKey);
  if (cached) return createSuccessResponse(cached);

  try {
    const sanitizedSymbol = symbol.trim().toUpperCase();
    const { fetchStockQuote } = await import('@/lib/services/stock-fetcher');
    const quoteData = await fetchStockQuote(sanitizedSymbol);

    if (quoteData) {
      setCache(cacheKey, quoteData, 60000); // 1 minute cache
      return createSuccessResponse(quoteData);
    }

    return createErrorResponse('Symbol not found in any of our providers', 404);
  } catch (error) {
    logError('Stock quote service failed', error, { symbol });
    return createErrorResponse('Failed to fetch stock quote. Please try again.', 500);
  }
}

export const GET = withErrorHandling(handleStockQuote);
