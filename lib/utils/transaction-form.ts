import type { Account } from '@/lib/types';

const getErrorMessage = (error: unknown): string | null => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  return null;
};

export const isKnownAccountId = (
  accountId: number | null | undefined,
  accounts: Account[]
): accountId is number =>
  typeof accountId === 'number' && accounts.some((account) => account.id === accountId);

export const getSafeAccountId = (
  accountId: number | null | undefined,
  accounts: Account[]
): number | undefined => (isKnownAccountId(accountId, accounts) ? accountId : undefined);

export const getSafeAccountSelectValue = (
  accountId: number | null | undefined,
  accounts: Account[]
): number | '' => (isKnownAccountId(accountId, accounts) ? accountId : '');

export const getTransactionSaveErrorMessage = (error: unknown, fallback: string): string => {
  const message = getErrorMessage(error);

  if (!message) {
    return fallback;
  }

  if (message.toLowerCase().includes('violates foreign key constraint')) {
    return 'The selected account is no longer available. Choose another account and try again.';
  }

  return message;
};
