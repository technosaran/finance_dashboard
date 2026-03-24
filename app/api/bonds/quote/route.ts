import { NextResponse } from 'next/server';
import { validateBondQuery } from '@/lib/validators/input';
import { getBondQuote, type BondQuote } from '@/lib/services/bonds';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCache,
  setCache,
} from '@/lib/services/api';

async function handleBondQuote(request: Request): Promise<NextResponse> {
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('isin') || searchParams.get('symbol');

  if (!identifier) {
    return createErrorResponse('Query parameter "isin" or "symbol" is required', 400);
  }

  const validation = validateBondQuery(identifier);
  if (!validation.isValid) {
    return createErrorResponse(validation.error || 'Invalid bond identifier', 400);
  }

  const cacheKey = `bond_quote_${identifier.trim().toUpperCase()}`;
  const cached = getCache<BondQuote>(cacheKey);
  if (cached) {
    return createSuccessResponse(cached);
  }

  const quote = getBondQuote(identifier);
  setCache(cacheKey, quote, 300000);

  return createSuccessResponse(quote);
}

export const GET = withErrorHandling(handleBondQuote);
