import {
  buildMonthlyTotals,
  filterTransactionsByTimeRange,
  matchesTransactionQuery,
  summarizeCategories,
} from '@/lib/utils/transaction-insights';

describe('filterTransactionsByTimeRange', () => {
  const transactions = [
    { id: 1, date: '2026-04-02' },
    { id: 2, date: '2026-03-20' },
    { id: 3, date: '2025-12-31' },
  ];

  const now = new Date(2026, 3, 5);

  it('filters transactions for the current month', () => {
    expect(filterTransactionsByTimeRange(transactions, 'This Month', now)).toEqual([
      { id: 1, date: '2026-04-02' },
    ]);
  });

  it('filters transactions for the current year', () => {
    expect(filterTransactionsByTimeRange(transactions, 'This Year', now)).toEqual([
      { id: 1, date: '2026-04-02' },
      { id: 2, date: '2026-03-20' },
    ]);
  });

  it('returns all transactions for all time', () => {
    expect(filterTransactionsByTimeRange(transactions, 'All Time', now)).toEqual(transactions);
  });
});

describe('matchesTransactionQuery', () => {
  const transaction = {
    description: 'April salary',
    category: 'Salary',
    type: 'Income' as const,
    amount: 120000,
  };

  it('matches against account names', () => {
    expect(matchesTransactionQuery(transaction, 'hdfc', 'HDFC Salary Account')).toBe(true);
  });

  it('matches against formatted amounts', () => {
    expect(matchesTransactionQuery(transaction, '120,000')).toBe(true);
  });

  it('returns false when the query is absent', () => {
    expect(matchesTransactionQuery(transaction, 'groceries')).toBe(false);
  });
});

describe('buildMonthlyTotals', () => {
  it('builds month buckets relative to the provided date', () => {
    const result = buildMonthlyTotals(
      [
        { date: '2026-04-02', amount: 1000 },
        { date: '2026-02-10', amount: 400 },
      ],
      3,
      new Date(2026, 3, 5)
    );

    expect(result).toEqual([
      { key: '2026-02', label: 'Feb', total: 400 },
      { key: '2026-03', label: 'Mar', total: 0 },
      { key: '2026-04', label: 'Apr', total: 1000 },
    ]);
  });
});

describe('summarizeCategories', () => {
  it('returns sorted category totals with shares', () => {
    const result = summarizeCategories([
      { category: 'Food', amount: 400 },
      { category: 'Food', amount: 100 },
      { category: 'Travel', amount: 500 },
    ]);

    expect(result[0]).toMatchObject({
      name: 'Food',
      total: 500,
      count: 2,
      share: 50,
    });
    expect(result[1]).toMatchObject({
      name: 'Travel',
      total: 500,
      count: 1,
      share: 50,
    });
  });
});
