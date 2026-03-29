import type { Metadata } from 'next';
import MutualFundsClient from './MutualFundsClient';

export const metadata: Metadata = {
  title: 'Mutual Funds | FINCORE',
  description: 'Track SIPs, fund holdings, and allocation across your mutual fund portfolio.',
};

export default function MutualFundsPage() {
  return <MutualFundsClient />;
}
