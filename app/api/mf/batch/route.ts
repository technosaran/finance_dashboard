import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCachedOrFetch,
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
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const parsed = parseCommaSeparatedParam(searchParams, 'codes');
  if (parsed.error) return parsed.error;
  const codes = parsed.items;

  const normalizedCodes = [...codes].sort();
  const cacheKey = `mf_batch_${normalizedCodes.join(',')}`;

  try {
    const results = await getCachedOrFetch<Record<string, MFQuoteData>>(
      cacheKey,
      async () => (await getMutualFundQuotes(normalizedCodes)) as Record<string, MFQuoteData>,
      60000
    );
    return createSuccessResponse(results);
  } catch (error) {
    logError('Batch MF quote fetch failed', error, { codes: normalizedCodes.join(',') });
    return createErrorResponse('Failed to fetch batch MF quotes', 500);
  }
}

export const GET = withErrorHandling(handleMFBatchQuote);
