import { NextResponse } from 'next/server';
import { validateBondQuery } from '@/lib/validators/input';
import { searchBondCatalog } from '@/lib/services/bonds';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
} from '@/lib/services/api';

async function handleBondSearch(request: Request): Promise<NextResponse> {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return createErrorResponse('Query parameter "q" is required', 400);
  }

  const validation = validateBondQuery(query);
  if (!validation.isValid) {
    return createErrorResponse(validation.error || 'Invalid bond query', 400);
  }

  return createSuccessResponse(searchBondCatalog(query));
}

export const GET = withErrorHandling(handleBondSearch);
