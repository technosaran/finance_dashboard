/**
 * Utility functions for exporting data to CSV format
 */

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return '';

  const columnHeaders = headers || Object.keys(data[0]);
  const headerRow = columnHeaders.join(',');

  const rows = data.map((row) => {
    return columnHeaders
      .map((header) => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\n');
}

export function exportTransactionsToCSV(
  transactions: Array<{
    date: string;
    description: string;
    category: string;
    type: string;
    amount: number;
  }>
) {
  const csvContent = arrayToCSV(transactions, [
    'date',
    'description',
    'category',
    'type',
    'amount',
  ]);

  const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}

export function exportAccountsToCSV(
  accounts: Array<{
    name: string;
    bankName: string;
    type: string;
    balance: number;
    currency: string;
  }>
) {
  const csvContent = arrayToCSV(accounts, ['name', 'bankName', 'type', 'balance', 'currency']);

  const filename = `accounts_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}

export function exportGoalsToCSV(
  goals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
  }>
) {
  const csvContent = arrayToCSV(goals, [
    'name',
    'targetAmount',
    'currentAmount',
    'deadline',
    'category',
  ]);

  const filename = `goals_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csvContent);
}
