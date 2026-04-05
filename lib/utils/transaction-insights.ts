import type { Transaction } from '@/lib/types';

export type TransactionTimeRange = 'This Month' | 'This Year' | 'All Time';

export interface CategorySummary {
  name: string;
  total: number;
  count: number;
  share: number;
}

export const COMMON_EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Utilities',
  'Rent',
  'Travel',
  'Other',
];

export const COMMON_TRANSACTION_CATEGORIES = [
  'Salary',
  'Bonus',
  'Business',
  'Investment',
  'Rent',
  ...COMMON_EXPENSE_CATEGORIES,
];

const toLocalDate = (value: string) => new Date(`${value}T00:00:00`);

export function filterTransactionsByTimeRange<T extends Pick<Transaction, 'date'>>(
  transactions: T[],
  range: TransactionTimeRange,
  now: Date = new Date()
): T[] {
  if (range === 'All Time') {
    return [...transactions];
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter((transaction) => {
    const transactionDate = toLocalDate(transaction.date);

    if (range === 'This Year') {
      return transactionDate.getFullYear() === currentYear;
    }

    return (
      transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth
    );
  });
}

export function matchesTransactionQuery(
  transaction: Pick<Transaction, 'description' | 'category' | 'type' | 'amount'>,
  query: string,
  accountName: string = ''
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  const compactQuery = normalizedQuery.replace(/[,\s]/g, '');

  if (!normalizedQuery) {
    return true;
  }

  const searchTokens = [
    transaction.description,
    String(transaction.category),
    transaction.type,
    accountName,
    transaction.amount.toString(),
    transaction.amount.toLocaleString('en-IN'),
    transaction.amount.toLocaleString('en-US'),
  ];

  const haystack = searchTokens.join(' ').toLowerCase();
  const compactHaystack = haystack.replace(/[,\s]/g, '');

  return haystack.includes(normalizedQuery) || compactHaystack.includes(compactQuery);
}

export function buildMonthlyTotals<T extends Pick<Transaction, 'date' | 'amount'>>(
  transactions: T[],
  monthCount: number = 6,
  now: Date = new Date()
) {
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - index - 1), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const total = transactions
      .filter((transaction) => transaction.date.startsWith(key))
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      key,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      total,
    };
  });
}

export function summarizeCategories<T extends Pick<Transaction, 'category' | 'amount'>>(
  transactions: T[]
): CategorySummary[] {
  const totals = new Map<string, { total: number; count: number }>();
  const grandTotal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  transactions.forEach((transaction) => {
    const name = String(transaction.category || 'Other');
    const existing = totals.get(name) || { total: 0, count: 0 };

    totals.set(name, {
      total: existing.total + transaction.amount,
      count: existing.count + 1,
    });
  });

  return [...totals.entries()]
    .map(([name, value]) => ({
      name,
      total: value.total,
      count: value.count,
      share: grandTotal > 0 ? (value.total / grandTotal) * 100 : 0,
    }))
    .sort((left, right) => right.total - left.total);
}
