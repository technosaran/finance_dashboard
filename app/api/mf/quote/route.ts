import { NextResponse } from 'next/server';
import { validateMFCode } from '@/lib/validators/input';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCachedOrFetch,
} from '@/lib/services/api';
import { getMutualFundQuote } from '@/lib/services/mutual-funds';
import { logError } from '@/lib/utils/logger';

/**
 * Mutual Fund quote API endpoint with security enhancements
 */
async function handleMFQuote(request: Request): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request);
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

  try {
    const quoteData = await getCachedOrFetch(
      cacheKey,
      async () => {
        const result = await getMutualFundQuote(code.trim());
        if (!result) throw new Error('MF_NOT_FOUND');
        return result;
      },
      300000
    );
    return createSuccessResponse(quoteData);
  } catch (error) {
    if (error instanceof Error && error.message === 'MF_NOT_FOUND') {
      return createErrorResponse('Mutual fund not found', 404);
    }
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
