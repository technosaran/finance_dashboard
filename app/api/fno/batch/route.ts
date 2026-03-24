import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
  getCache,
  setCache,
  parseCommaSeparatedParam,
  deterministicHash,
} from '@/lib/services/api';
import { logError } from '@/lib/utils/logger';

interface FnoPositionData {
  instrument: string;
  ltp: number;
  change: number;
  updatedAt: string;
}

/**
 * Batch FnO position quote API endpoint
 */
async function handleFnoBatchQuote(request: Request): Promise<NextResponse> {
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const parsed = parseCommaSeparatedParam(searchParams, 'instruments', {
    transform: (s) => s.trim().toUpperCase(),
  });
  if (parsed.error) return parsed.error;
  const instruments = parsed.items;

  const cacheKey = `fno_batch_${instruments.sort().join(',')}`;
  const cached = getCache<Record<string, FnoPositionData>>(cacheKey);
  if (cached) return createSuccessResponse(cached);

  try {
    const results: Record<string, FnoPositionData> = {};
    const today = new Date().toISOString().split('T')[0];

    instruments.forEach((inst) => {
      const hash = deterministicHash(inst + today);

      // Base price simulation - try to parse numbers from instrument like "NIFTY 21500 CE"
      const numMatch = inst.match(/\d+/);
      const basePrice = numMatch ? parseInt(numMatch[0]) / 100 : 100;

      const fluctuation = (Math.abs(hash) % 201) / 100 - 1;
      const change = (Math.abs(hash) % 101) / 50 - 1;

      results[inst] = {
        instrument: inst,
        ltp: Number((basePrice + fluctuation).toFixed(2)),
        change: Number(change.toFixed(2)),
        updatedAt: new Date().toISOString(),
      };
    });

    setCache(cacheKey, results, 30000);
    return createSuccessResponse(results);
  } catch (error) {
    logError('Batch fno quote fetch failed', error, { instruments: instruments.join(',') });
    return createErrorResponse('Failed to fetch batch FnO quotes', 500);
  }
}

export const GET = withErrorHandling(handleFnoBatchQuote);
