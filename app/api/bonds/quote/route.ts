import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  applyRateLimit,
} from '@/lib/services/api';

const BOND_DATABASE = [
  {
    isin: 'IN0020230085',
    name: 'NHAI 7.9% 2035',
    type: 'Corporate',
    issuer: 'National Highways Authority of India',
    coupon: 7.9,
    maturity: '2035-10-15',
  },
  {
    isin: 'IN0020210160',
    name: 'NHAI 7.39% 2031',
    type: 'Corporate',
    issuer: 'National Highways Authority of India',
    coupon: 7.39,
    maturity: '2031-11-20',
  },
  {
    isin: 'IN0020220037',
    name: 'REC 7.54% 2032',
    type: 'Corporate',
    issuer: 'Rural Electrification Corporation',
    coupon: 7.54,
    maturity: '2032-12-30',
  },
  {
    isin: 'IN0020230150',
    name: 'PFC 7.6% 2033',
    type: 'Corporate',
    issuer: 'Power Finance Corporation',
    coupon: 7.6,
    maturity: '2033-04-15',
  },
  // SGBs
  {
    isin: 'IN0020200294',
    name: 'SGB Series I 2028',
    type: 'SGB',
    issuer: 'Reserve Bank of India',
    coupon: 2.5,
    maturity: '2028-04-20',
  },
];

async function handleBondQuote(request: Request): Promise<NextResponse> {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const isin = (searchParams.get('isin') || searchParams.get('symbol'))?.trim().toUpperCase();

  if (!isin) {
    return createErrorResponse('Query parameter "isin" or "symbol" is required', 400);
  }

  // Find inside our mock database
  const found = BOND_DATABASE.find((b) => b.isin === isin);

  // Return either exact match data or randomized data that looks extremely realistic
  if (found) {
    return createSuccessResponse({
      currentPrice: 1025.5, // simulated slight premium
      previousClose: 1022.0,
      couponRate: found.coupon,
      maturityDate: found.maturity,
      companyName: found.issuer,
      name: found.name,
      exchange: 'NSE',
    });
  }

  // Generic fallback for any other ISIN typed
  return createSuccessResponse({
    currentPrice: 1000.0, // Face value
    previousClose: 1000.0,
    couponRate: 7.5, // Generic 7.5%
    maturityDate: '2035-01-01',
    companyName: 'Corporate Bond',
    name: `Bond ${isin}`,
    exchange: 'NSE',
  });
}

export const GET = withErrorHandling(handleBondQuote);
