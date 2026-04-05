import {
  getSafeAccountId,
  getSafeAccountSelectValue,
  getTransactionSaveErrorMessage,
  isKnownAccountId,
} from '@/lib/utils/transaction-form';

const accounts = [
  {
    id: 1,
    name: 'Primary',
    bankName: 'HDFC',
    type: 'Savings' as const,
    balance: 50000,
    currency: 'INR' as const,
  },
];

describe('transaction-form helpers', () => {
  it('recognizes valid account ids', () => {
    expect(isKnownAccountId(1, accounts)).toBe(true);
    expect(isKnownAccountId(99, accounts)).toBe(false);
  });

  it('sanitizes missing or stale account ids', () => {
    expect(getSafeAccountId(1, accounts)).toBe(1);
    expect(getSafeAccountId(99, accounts)).toBeUndefined();
    expect(getSafeAccountId(undefined, accounts)).toBeUndefined();
  });

  it('returns a safe select value', () => {
    expect(getSafeAccountSelectValue(1, accounts)).toBe(1);
    expect(getSafeAccountSelectValue(99, accounts)).toBe('');
  });

  it('maps foreign key errors to a user-friendly message', () => {
    expect(
      getTransactionSaveErrorMessage(
        { message: 'insert or update on table "transactions" violates foreign key constraint' },
        'Failed to save transaction'
      )
    ).toBe('The selected account is no longer available. Choose another account and try again.');
  });

  it('falls back when the error is not readable', () => {
    expect(getTransactionSaveErrorMessage(null, 'Failed to save transaction')).toBe(
      'Failed to save transaction'
    );
  });
});
