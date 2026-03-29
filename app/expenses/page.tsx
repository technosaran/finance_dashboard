import type { Metadata } from 'next';
import ExpensesClient from './ExpensesClient';

export const metadata: Metadata = {
  title: 'Expenses | FINCORE',
  description: 'Track expenses by category, review spending patterns, and stay on budget.',
};

export default function ExpensesPage() {
  return <ExpensesClient />;
}
