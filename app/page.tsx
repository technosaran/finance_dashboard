import type { Metadata } from 'next';
import Dashboard from './components/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | FINCORE Portfolio Manager',
  description:
    'Global overview of your financial empire, including net worth, asset allocation, and recent activity.',
};

export default function Home() {
  return <Dashboard />;
}
