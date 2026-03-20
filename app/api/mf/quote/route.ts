import { NextResponse } from 'next/server';
import { validateMFCode } from '@/lib/validators/input';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCache,
  setCache,
} from '@/lib/services/api';
import { getMutualFundQuote } from '@/lib/services/mutual-funds';
import { logError } from '@/lib/utils/logger';

/**
 * Mutual Fund quote API endpoint with security enhancements
 */
async function handleMFQuote(request: Request): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return createErrorResponse('Scheme code parameter is required', 400);
  }

  // Validate MF code
  const validation = validateMFCode(code);
  if (!validation.isValid) {
    return createErrorResponse(validation.error || 'Invalid scheme code', 400);
  }

  const cacheKey = `mf_quote_${code.trim()}`;
  const cached = getCache<{
    schemeCode: string;
    schemeName: string;
    category: string;
    currentNav: number;
    previousNav: number;
    date: string;
  }>(cacheKey);
  if (cached) return createSuccessResponse(cached);

  try {
    const quoteData = await getMutualFundQuote(code.trim());
    if (!quoteData) return createErrorResponse('Mutual fund not found', 404);

    setCache(cacheKey, quoteData, 300000);
    return createSuccessResponse(quoteData);
  } catch (error) {
    logError('MF quote fetch failed', error, { code });

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return createErrorResponse('Request timeout. Please try again.', 504);
      }
      return createErrorResponse(
        'Failed to fetch mutual fund details. Please try again later.',
        500
      );
    }

    return createErrorResponse('An unexpected error occurred', 500);
  }
}

export const GET = withErrorHandling(handleMFQuote);
