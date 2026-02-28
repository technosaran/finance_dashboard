import type { Metadata } from 'next';
import ForexClient from './ForexClient';

export const metadata: Metadata = {
  title: 'Forex Trading | FINCORE',
  description:
    'Track your forex deposits, withdrawals, profits, and losses with live exchange rate data.',
};

export default function ForexPage() {
  return <ForexClient />;
}
