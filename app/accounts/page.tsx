import type { Metadata } from 'next';
import AccountsClient from './AccountsClient';

export const metadata: Metadata = {
  title: 'Accounts | FINCORE Accounts',
  description: 'Manage bank accounts, savings balances, and cash positions in one place.',
};

export default function AccountsPage() {
  return <AccountsClient />;
}
