import type { Metadata } from 'next';
import StocksClient from './StocksClient';

export const metadata: Metadata = {
  title: 'Stocks | FINCORE Equity Portfolio',
  description: 'Track stock holdings, performance, allocation, and trade history.',
};

export default function StocksPage() {
  return <StocksClient />;
}
