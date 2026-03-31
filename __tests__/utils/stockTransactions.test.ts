import {
  calculateStockTradeChargesTotal,
  calculateStockTradeSettlement,
  validateStockTrade,
} from '@/lib/utils/stock-transactions';

describe('calculateStockTradeChargesTotal', () => {
  it('adds brokerage and taxes together', () => {
    expect(calculateStockTradeChargesTotal(12.55, 8.25)).toBe(20.8);
  });

  it('treats invalid values as zero', () => {
    expect(calculateStockTradeChargesTotal(Number.NaN, 8.25)).toBe(8.25);
  });
});

describe('calculateStockTradeSettlement', () => {
  it('calculates buy settlement as gross amount plus charges', () => {
    expect(calculateStockTradeSettlement('BUY', 10000, 0, 25.35)).toBe(10025.35);
  });

  it('calculates sell settlement as gross amount minus charges', () => {
    expect(calculateStockTradeSettlement('SELL', 10000, 0, 25.35)).toBe(9974.65);
  });
});

describe('validateStockTrade', () => {
  it('rejects non-positive quantities', () => {
    expect(validateStockTrade({ transactionType: 'BUY', quantity: 0 })).toEqual({
      isValid: false,
      message: 'Quantity must be greater than zero.',
    });
  });

  it('rejects sells larger than available holdings', () => {
    expect(
      validateStockTrade({
        transactionType: 'SELL',
        quantity: 12,
        availableQuantity: 8,
      })
    ).toEqual({
      isValid: false,
      message: 'You only have 8 shares available to sell.',
    });
  });

  it('rejects buys when account balance is short', () => {
    expect(
      validateStockTrade({
        transactionType: 'BUY',
        quantity: 10,
        settlementAmount: 1250.25,
        accountBalance: 1000,
      })
    ).toEqual({
      isValid: false,
      message: 'Insufficient account balance for this order.',
      shortfall: 250.25,
    });
  });

  it('passes valid orders', () => {
    expect(
      validateStockTrade({
        transactionType: 'BUY',
        quantity: 10,
        settlementAmount: 1250.25,
        accountBalance: 2000,
      })
    ).toEqual({ isValid: true });
  });
});
