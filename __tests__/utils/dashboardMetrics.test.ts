import { computeDashboardMetrics } from '@/lib/utils/dashboard-metrics';
import {
  Account,
  Bond,
  BondTransaction,
  MutualFund,
  MutualFundTransaction,
  Stock,
  StockTransaction,
} from '@/lib/types';

const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 1,
  name: 'Main',
  bankName: 'Bank',
  type: 'Savings',
  balance: 50000,
  currency: 'INR',
  ...overrides,
});

const makeStock = (overrides: Partial<Stock> = {}): Stock => ({
  id: 1,
  symbol: 'RELIANCE',
  companyName: 'Reliance Industries',
  quantity: 10,
  avgPrice: 1000,
  currentPrice: 1200,
  previousPrice: 1100,
  exchange: 'NSE',
  investmentAmount: 10000,
  currentValue: 12000,
  pnl: 2000,
  pnlPercentage: 20,
  ...overrides,
});

const makeMutualFund = (overrides: Partial<MutualFund> = {}): MutualFund => ({
  id: 1,
  schemeName: 'Index Fund',
  schemeCode: '100001',
  units: 100,
  avgNav: 50,
  currentNav: 60,
  previousNav: 55,
  category: 'Index',
  investmentAmount: 5000,
  currentValue: 6000,
  pnl: 1000,
  pnlPercentage: 20,
  ...overrides,
});

const makeBond = (overrides: Partial<Bond> = {}): Bond => ({
  id: 1,
  name: 'Gov Bond',
  quantity: 10,
  avgPrice: 900,
  currentPrice: 1000,
  status: 'ACTIVE',
  investmentAmount: 9000,
  currentValue: 10000,
  pnl: 1000,
  pnlPercentage: 11.11,
  ...overrides,
});

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
  transactionDate: '2024-02-01',
  ...overrides,
});

const makeBondTransaction = (overrides: Partial<BondTransaction> = {}): BondTransaction => ({
  id: 1,
  bondId: 1,
  transactionType: 'BUY',
  quantity: 10,
  price: 900,
  totalAmount: 9000,
  transactionDate: '2024-03-01',
  ...overrides,
});

describe('computeDashboardMetrics', () => {
  it('computes net worth and current investment totals across tracked asset classes', () => {
    const result = computeDashboardMetrics({
      accounts: [makeAccount({ balance: 50000 })],
      stocks: [makeStock({ currentValue: 12000 })],
      mutualFunds: [makeMutualFund({ currentValue: 6000 })],
      bonds: [makeBond({ currentValue: 10000 })],
      stockTransactions: [],
      mutualFundTransactions: [],
      bondTransactions: [],
    });

    expect(result.liquidityINR).toBe(50000);
    expect(result.totalTrackedInvestmentValue).toBe(28000);
    expect(result.totalNetWorth).toBe(78000);
  });

  it('computes open cost basis, unrealized pnl, and day change from live holdings', () => {
    const result = computeDashboardMetrics({
      accounts: [],
      stocks: [makeStock({ investmentAmount: 10000, pnl: 2000, quantity: 10 })],
      mutualFunds: [makeMutualFund({ investmentAmount: 5000, pnl: 1000, units: 100 })],
      bonds: [makeBond({ investmentAmount: 9000, pnl: 1000 })],
      stockTransactions: [],
      mutualFundTransactions: [],
      bondTransactions: [],
    });

    expect(result.totalOpenCostBasis).toBe(24000);
    expect(result.totalUnrealizedPnl).toBe(4000);
    expect(result.marketDayChange).toBe(1500);
  });

  it('computes tracked profit net of recorded fees and a money-weighted return', () => {
    const result = computeDashboardMetrics({
      accounts: [],
      stocks: [makeStock({ investmentAmount: 10000, currentValue: 12000, pnl: 2000 })],
      mutualFunds: [makeMutualFund({ investmentAmount: 5000, currentValue: 6000, pnl: 1000 })],
      bonds: [makeBond({ investmentAmount: 9000, currentValue: 10000, pnl: 1000 })],
      stockTransactions: [makeStockTransaction({ totalAmount: 10000, taxes: 60 })],
      mutualFundTransactions: [makeMutualFundTransaction({ totalAmount: 5000 })],
      bondTransactions: [makeBondTransaction({ totalAmount: 9000, price: 900 })],
      asOfDate: '2025-01-01',
    });

    expect(result.trackedProfit).toBeCloseTo(3939.74, 2);
    expect(result.trackedFees).toBeCloseTo(60.26, 2);
    expect(result.trackedMoneyWeightedReturn).not.toBeNull();
    expect(result.trackedMoneyWeightedReturn!).toBeGreaterThan(0);
  });

  it('keeps money-weighted return null when there is not enough cash-flow information', () => {
    const result = computeDashboardMetrics({
      accounts: [],
      stocks: [],
      mutualFunds: [],
      bonds: [],
      stockTransactions: [makeStockTransaction({ totalAmount: 10000, taxes: 60 })],
      mutualFundTransactions: [],
      bondTransactions: [],
      asOfDate: '2025-01-01',
    });

    expect(result.trackedProfit).toBe(-10060);
    expect(result.trackedMoneyWeightedReturn).toBeNull();
  });
});
