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

export function arrayToCSV<T extends object>(data: T[], headers?: string[]): string {
  if (data.length === 0) return '';

  const firstRow = data[0] as Record<string, unknown>;
  const columnHeaders = headers || Object.keys(firstRow);
  const headerRow = columnHeaders.join(',');

  const rows = data.map((row) => {
    const csvRow = row as Record<string, unknown>;
    return columnHeaders
      .map((header) => {
        const value = csvRow[header];
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

export function exportTransactionsToCSV<T extends object>(
  transactions: T[],
  options: {
    headers?: string[];
    filenamePrefix?: string;
  } = {}
) {
  const csvContent = arrayToCSV(
    transactions,
    options.headers || ['date', 'description', 'category', 'type', 'amount']
  );

  const filename = `${options.filenamePrefix || 'transactions'}_${
    new Date().toISOString().split('T')[0]
  }.csv`;
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
