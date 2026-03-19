/**
 * Secure API handler utilities
 * Provides consistent error handling, timeout management, and response formatting
 */

import { NextResponse } from 'next/server';
import { logError, logWarn } from '../utils/logger';

export interface ApiError {
  error: string;
  message?: string;
  status: number;
}

/**
 * Handle CORS preflight requests (OPTIONS method)
 */
export function handleCorsPreflightRequest(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  logWarn(`API Error: ${message}`, { status });
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Fetch with timeout wrapper
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Safe JSON parse with error handling
 */
export async function safeJsonParse<T>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch (error) {
    logError('Failed to parse JSON response', error);
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Wrapper for API handlers with consistent error handling
 */
export function withErrorHandling(handler: (request: Request) => Promise<NextResponse>) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      logError('API handler error', error);

      // Never expose internal error messages to clients
      return createErrorResponse('An unexpected error occurred', 500);
    }
  };
}

/**
 * Rate limiting storage (in-memory - for production use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_CLEANUP_THRESHOLD = 500;
const RATE_LIMIT_MAX_SIZE = 1000;

/**
 * Simple in-memory rate limiter
 * For production, use a proper rate limiting service like Upstash
 */
export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries when store grows large to prevent memory leaks
  if (rateLimitStore.size > RATE_LIMIT_CLEANUP_THRESHOLD) {
    const keysToDelete: string[] = [];
    for (const [key, val] of rateLimitStore) {
      if (now > val.resetTime) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      rateLimitStore.delete(key);
    }

    // Hard limit: if still too large, remove oldest entries (FIFO)
    if (rateLimitStore.size >= RATE_LIMIT_MAX_SIZE) {
      // Remove oldest 100 entries
      const keysToRemove = Array.from(rateLimitStore.keys()).slice(0, 100);
      for (const key of keysToRemove) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(request: Request): NextResponse | null {
  const ip = getClientIP(request);
  const { success } = rateLimit(ip, 30, 60000); // 30 requests per minute

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    );
  }

  return null;
}
/**
 * Simple in-memory cache for API responses
 */
const apiCache = new Map<string, { data: unknown; expire: number }>();
const API_CACHE_CLEANUP_THRESHOLD = 500;
const API_CACHE_MAX_SIZE = 1000;

/**
 * Clean up expired cache entries to prevent memory leaks
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, val] of apiCache) {
    if (now >= val.expire) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    apiCache.delete(key);
  }
}

/**
 * Get cached data if available and not expired
 */
export function getCache<T>(key: string): T | null {
  const record = apiCache.get(key);
  if (record && Date.now() < record.expire) {
    return record.data as T;
  }
  if (record) {
    apiCache.delete(key);
  }
  return null;
}

/**
 * Set cache with TTL and automatic cleanup
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 300000): void {
  // Periodic cleanup when cache grows large
  if (apiCache.size > API_CACHE_CLEANUP_THRESHOLD) {
    cleanupExpiredCache();
  }

  // Hard limit to prevent unbounded growth
  if (apiCache.size >= API_CACHE_MAX_SIZE) {
    // Remove oldest entries (simple FIFO)
    const keysToDelete = Array.from(apiCache.keys()).slice(0, 100);
    for (const key of keysToDelete) {
      apiCache.delete(key);
    }
  }

  apiCache.set(key, { data, expire: Date.now() + ttlMs });
}

/**
 * Clear all cached data (useful for testing or manual refresh)
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Parse a comma-separated query parameter into a validated list of strings.
 * Returns an error response if the list is empty or exceeds maxItems.
 */
export function parseCommaSeparatedParam(
  searchParams: URLSearchParams,
  paramName: string,
  options: { maxItems?: number; transform?: (s: string) => string } = {}
): { items: string[]; error?: never } | { items?: never; error: NextResponse } {
  const raw = searchParams.get(paramName);
  const { maxItems = 50, transform = (s: string) => s.trim() } = options;

  if (!raw) {
    return {
      error: createErrorResponse(`Missing required parameter: ${paramName}`, 400),
    };
  }

  const items = raw.split(',').map(transform).filter(Boolean);

  if (items.length === 0) {
    return { error: createErrorResponse(`No valid ${paramName} provided`, 400) };
  }

  if (items.length > maxItems) {
    return {
      error: createErrorResponse(`Maximum ${maxItems} ${paramName} allowed per batch`, 400),
    };
  }

  return { items };
}

/**
 * Deterministic hash from a string seed. Used for simulated price fluctuations.
 */
export function deterministicHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}
