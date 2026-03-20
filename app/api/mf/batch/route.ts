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
import { getMutualFundQuotes } from '@/lib/services/mutual-funds';
import { logError } from '@/lib/utils/logger';

interface MFQuoteData {
  schemeCode: string;
  schemeName: string;
  category: string;
  currentNav: number;
  previousNav: number;
  date: string;
}

/**
 * Batch Mutual Fund quote API endpoint
 */
async function handleMFBatchQuote(request: Request): Promise<NextResponse> {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const parsed = parseCommaSeparatedParam(searchParams, 'codes');
  if (parsed.error) return parsed.error;
  const codes = parsed.items;

  const cacheKey = `mf_batch_${codes.sort().join(',')}`;
  const cached = getCache<Record<string, MFQuoteData>>(cacheKey);
  if (cached) return createSuccessResponse(cached);

  try {
    const results = (await getMutualFundQuotes(codes)) as Record<string, MFQuoteData>;
    for (const [code, quote] of Object.entries(results)) {
      setCache(`mf_quote_${code}`, quote, 300000);
    }
    setCache(cacheKey, results, 60000); // 1 minute cache for batch request
    return createSuccessResponse(results);
  } catch (error) {
    logError('Batch MF quote fetch failed', error, { codes: codes.join(',') });
    return createErrorResponse('Failed to fetch batch MF quotes', 500);
  }
}

export const GET = withErrorHandling(handleMFBatchQuote);
