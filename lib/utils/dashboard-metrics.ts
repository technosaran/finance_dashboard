import {
  Account,
  Bond,
  BondTransaction,
  MutualFund,
  MutualFundTransaction,
  Stock,
  StockTransaction,
} from '@/lib/types';
import {
  buildBondPerformanceInput,
  buildMutualFundPerformanceInput,
  buildStockPerformanceInput,
  combinePerformanceInputs,
  summarizePerformance,
} from '@/lib/utils/performance';

export interface DashboardFinancialMetrics {
  liquidityINR: number;
  stocksValue: number;
  mfValue: number;
  bondsValue: number;
  totalNetWorth: number;
  totalTrackedInvestmentValue: number;
  totalOpenCostBasis: number;
  totalUnrealizedPnl: number;
  marketDayChange: number;
  trackedProfit: number;
  trackedFees: number;
  trackedMoneyWeightedReturn: number | null;
}

export function computeDashboardMetrics(params: {
  accounts: Account[];
  stocks: Stock[];
  mutualFunds: MutualFund[];
  bonds: Bond[];
  stockTransactions: StockTransaction[];
  mutualFundTransactions: MutualFundTransaction[];
  bondTransactions: BondTransaction[];
  asOfDate?: Date | string;
}): DashboardFinancialMetrics {
  const {
    accounts,
    stocks,
    mutualFunds,
    bonds,
    stockTransactions,
    mutualFundTransactions,
    bondTransactions,
    asOfDate,
  } = params;

  const activeStocks = stocks.filter((stock) => stock.quantity > 0);

  const liquidityINR = accounts
    .filter((account) => account.currency === 'INR')
    .reduce((total, account) => total + account.balance, 0);

  const stocksValue = activeStocks.reduce((total, stock) => total + stock.currentValue, 0);
  const mfValue = mutualFunds.reduce((total, fund) => total + fund.currentValue, 0);
  const bondsValue = bonds.reduce((total, bond) => total + bond.currentValue, 0);
  const totalTrackedInvestmentValue = stocksValue + mfValue + bondsValue;
  const totalNetWorth = liquidityINR + totalTrackedInvestmentValue;

  const totalOpenCostBasis =
    activeStocks.reduce((total, stock) => total + stock.investmentAmount, 0) +
    mutualFunds.reduce((total, fund) => total + fund.investmentAmount, 0) +
    bonds.reduce((total, bond) => total + bond.investmentAmount, 0);

  const totalUnrealizedPnl =
    activeStocks.reduce((total, stock) => total + stock.pnl, 0) +
    mutualFunds.reduce((total, fund) => total + fund.pnl, 0) +
    bonds.reduce((total, bond) => total + bond.pnl, 0);

  const stockDayChange = activeStocks.reduce((total, stock) => {
    const previousPrice = stock.previousPrice ?? stock.currentPrice;
    return total + (stock.currentPrice - previousPrice) * stock.quantity;
  }, 0);

  const mfDayChange = mutualFunds.reduce((total, fund) => {
    const previousNav = fund.previousNav ?? fund.currentNav;
    return total + (fund.currentNav - previousNav) * fund.units;
  }, 0);

  const trackedPerformance = summarizePerformance(
    combinePerformanceInputs([
      buildStockPerformanceInput(stockTransactions),
      buildMutualFundPerformanceInput(mutualFundTransactions),
      buildBondPerformanceInput(bondTransactions),
    ]),
    totalTrackedInvestmentValue,
    asOfDate
  );

  return {
    liquidityINR,
    stocksValue,
    mfValue,
    bondsValue,
    totalNetWorth,
    totalTrackedInvestmentValue,
    totalOpenCostBasis,
    totalUnrealizedPnl,
    marketDayChange: stockDayChange + mfDayChange,
    trackedProfit: trackedPerformance.absoluteProfit,
    trackedFees: trackedPerformance.fees,
    trackedMoneyWeightedReturn: trackedPerformance.moneyWeightedReturn,
  };
}
