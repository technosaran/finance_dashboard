import type { Metadata } from 'next';
import Dashboard from './components/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | FINCORE Portfolio Manager',
  description:
    'A clear overview of your net worth, asset allocation, and recent financial activity.',
};

export default function Home() {
  return <Dashboard />;
}
