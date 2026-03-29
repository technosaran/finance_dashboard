import type { Metadata } from 'next';
import LedgerClient from './LedgerClient';

export const metadata: Metadata = {
  title: 'Ledger | FINCORE Global Activity',
  description: 'Review income and expense entries with filters for category, account, and date.',
};

export default function LedgerPage() {
  return <LedgerClient />;
}
