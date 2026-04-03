import type { Metadata } from 'next';
import SalaryClient from './SalaryClient';

export const metadata: Metadata = {
  title: 'Salary | FINCORE',
  description: 'Track your dedicated salary payouts and bonuses over time.',
};

export default function SalaryPage() {
  return <SalaryClient />;
}
