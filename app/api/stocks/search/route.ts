import { NextResponse } from 'next/server';
import { validateStockQuery } from '@/lib/validators/input';
import {
  createErrorResponse,
  createSuccessResponse,
  fetchWithTimeout,
  withErrorHandling,
  applyRateLimit,
} from '@/lib/services/api';
import { logError } from '@/lib/utils/logger';

/**
 * Stock search API endpoint with security enhancements
 * - Input validation to prevent injection attacks
 * - Rate limiting to prevent abuse
 * - Timeout handling
 * - Proper error responses
 */
async function handleStockSearch(request: Request): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Parse and validate query parameter
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return createErrorResponse('Query parameter "q" is required', 400);
  }

  // Validate input
  const validation = validateStockQuery(query);
  if (!validation.isValid) {
    return createErrorResponse(validation.error || 'Invalid query', 400);
  }

  try {
    // Sanitize and encode query
    const sanitizedQuery = query.trim().toUpperCase();
    const encodedQuery = encodeURIComponent(sanitizedQuery);

    // Fetch from Yahoo Finance API with timeout
    const response = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodedQuery}&quotesCount=10&newsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      },
      5000 // 5 second timeout
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter for Indian stocks and sanitize response
    interface YahooQuote {
      symbol: string;
      shortname?: string;
      longname?: string;
      exchange?: string;
      quoteType?: string;
    }

    const results = (data.quotes || [])
      .filter((quote: YahooQuote) => quote.symbol.endsWith('.NS') || quote.symbol.endsWith('.BO'))
      .map((quote: YahooQuote) => ({
        symbol: quote.symbol.split('.')[0],
        fullSymbol: quote.symbol,
        companyName: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange || 'NSE',
        type: quote.quoteType || 'EQUITY',
      }))
      .slice(0, 10); // Limit to 10 results

    return createSuccessResponse(results);
  } catch (error) {
    logError('Stock search failed', error, { query });

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return createErrorResponse('Request timeout. Please try again.', 504);
      }
      return createErrorResponse('Failed to search stocks. Please try again later.', 500);
    }

    return createErrorResponse('An unexpected error occurred', 500);
  }
}

export const GET = withErrorHandling(handleStockSearch);
