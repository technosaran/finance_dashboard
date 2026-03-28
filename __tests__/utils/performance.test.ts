import {
  calculateTimeWeightedReturn,
  calculateXirr,
  summarizeBondPerformance,
  summarizeMutualFundPerformance,
  summarizeStockPerformance,
} from '@/lib/utils/performance';
import { BondTransaction, MutualFundTransaction, StockTransaction } from '@/lib/types';

const makeStockTransaction = (overrides: Partial<StockTransaction> = {}): StockTransaction => ({
  id: 1,
  stockId: 1,
  transactionType: 'BUY',
  quantity: 10,
  price: 1000,
  totalAmount: 10000,
  brokerage: 0,
  taxes: 60,
  transactionDate: '2024-01-01',
  ...overrides,
});

const makeMutualFundTransaction = (
  overrides: Partial<MutualFundTransaction> = {}
): MutualFundTransaction => ({
  id: 1,
  mutualFundId: 1,
  transactionType: 'BUY',
  units: 100,
  nav: 50,
  totalAmount: 5000,
  transactionDate: '2024-01-01',
  ...overrides,
});

const makeBondTransaction = (overrides: Partial<BondTransaction> = {}): BondTransaction => ({
  id: 1,
  bondId: 1,
  transactionType: 'BUY',
  quantity: 10,
  price: 900,
  totalAmount: 9000,
  transactionDate: '2024-01-01',
  ...overrides,
});

describe('calculateXirr', () => {
  it('returns the expected annualized rate for a simple one-year gain', () => {
    const result = calculateXirr([
      { date: '2023-01-01', amount: -1000 },
      { date: '2024-01-01', amount: 1100 },
    ]);

    expect(result).toBeCloseTo(0.1, 6);
  });

  it('returns null without at least one positive and one negative cash flow', () => {
    const result = calculateXirr([
      { date: '2024-01-01', amount: -1000 },
      { date: '2024-06-01', amount: -500 },
    ]);

    expect(result).toBeNull();
  });
});

describe('summarizeStockPerformance', () => {
  it('includes stock fees in invested cash and profit math', () => {
    const result = summarizeStockPerformance(
      [
        makeStockTransaction({ transactionType: 'BUY', totalAmount: 10000, taxes: 60 }),
        makeStockTransaction({
          id: 2,
          transactionType: 'SELL',
          totalAmount: 8000,
          taxes: 48,
          transactionDate: '2024-08-01',
        }),
      ],
      4000,
      '2025-01-01'
    );

    expect(result.cashIn).toBe(10060);
    expect(result.cashOut).toBe(7952);
    expect(result.fees).toBe(108);
    expect(result.absoluteProfit).toBe(1892);
    expect(result.moneyWeightedReturn).not.toBeNull();
  });
});

describe('summarizeMutualFundPerformance', () => {
  it('includes stamp duty on buys and SIPs', () => {
    const result = summarizeMutualFundPerformance(
      [makeMutualFundTransaction({ transactionType: 'SIP', totalAmount: 5000 })],
      5600,
      '2025-01-01'
    );

    expect(result.cashIn).toBeCloseTo(5000.25, 2);
    expect(result.fees).toBeCloseTo(0.25, 2);
    expect(result.absoluteProfit).toBeCloseTo(599.75, 2);
    expect(result.moneyWeightedReturn).not.toBeNull();
  });
});

describe('summarizeBondPerformance', () => {
  it('includes bond charges in tracked profit', () => {
    const result = summarizeBondPerformance([makeBondTransaction()], 10000, '2025-01-01');

    expect(result.cashIn).toBeCloseTo(9000.01, 2);
    expect(result.fees).toBeCloseTo(0.01, 2);
    expect(result.absoluteProfit).toBeCloseTo(999.99, 2);
  });
});

describe('calculateTimeWeightedReturn', () => {
  it('chains subperiod returns multiplicatively', () => {
    const result = calculateTimeWeightedReturn([0.1, -0.05, 0.02]);

    expect(result).toBeCloseTo(0.0659, 4);
  });

  it('returns null when there are no subperiod returns', () => {
    expect(calculateTimeWeightedReturn([])).toBeNull();
  });
});
