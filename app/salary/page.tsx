import type { Metadata } from 'next';
import IncomeClient from './IncomeClient';

export const metadata: Metadata = {
  title: 'Income | FINCORE',
  description: 'Track salary, freelance income, and other credits over time.',
};

export default function SalaryPage() {
  return <IncomeClient />;
}
