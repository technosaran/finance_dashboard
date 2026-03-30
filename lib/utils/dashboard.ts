import type {
  Account,
  Bond,
  FnoTrade,
  MutualFund,
  MutualFundTransaction,
  Stock,
  StockTransaction,
  Transaction,
} from '@/lib/types';
import { getTransactionSignedAmount, isTransferTransaction } from '@/lib/utils/transactions';

interface DashboardMetricsInput {
  accounts: Account[];
  transactions: Transaction[];
  stocks: Stock[];
  stockTransactions: StockTransaction[];
  mutualFunds: MutualFund[];
  mutualFundTransactions: MutualFundTransaction[];
  fnoTrades: FnoTrade[];
  bonds: Bond[];
}

export interface DashboardMetrics {
  liquidityINR: number;
  stocksValue: number;
  mutualFundsValue: number;
  bondsValue: number;
  totalNetWorth: number;
  totalInvestment: number;
  realizedPnl: number;
  totalUnrealizedPnl: number;
  todayMovement: number;
  netMovement: number;
}

export function calculateDashboardMetrics({
  accounts,
  transactions,
  stocks,
  stockTransactions,
  mutualFunds,
  mutualFundTransactions,
  fnoTrades,
  bonds,
}: DashboardMetricsInput): DashboardMetrics {
  const liquidityINR = accounts
    .filter((account) => account.currency === 'INR')
    .reduce((sum, account) => sum + account.balance, 0);

  const activeStocks = stocks.filter((stock) => stock.quantity > 0);
  const activeBonds = bonds.filter((bond) => bond.quantity > 0 || bond.currentValue > 0);

  const stocksValue = activeStocks.reduce((sum, stock) => sum + stock.currentValue, 0);
  const mutualFundsValue = mutualFunds.reduce((sum, fund) => sum + fund.currentValue, 0);
  const bondsValue = activeBonds.reduce((sum, bond) => sum + bond.currentValue, 0);

  const stockInvestment = activeStocks.reduce((sum, stock) => sum + stock.investmentAmount, 0);
  const mutualFundInvestment = mutualFunds.reduce((sum, fund) => sum + fund.investmentAmount, 0);
  const bondInvestment = activeBonds.reduce((sum, bond) => sum + bond.investmentAmount, 0);

  const totalInvestment = stockInvestment + mutualFundInvestment + bondInvestment;

  const stockRealized = stockTransactions.reduce((sum, transaction) => {
    if (transaction.transactionType === 'SELL') {
      return sum + transaction.totalAmount;
    }

    return (
      sum - (transaction.totalAmount + (transaction.brokerage || 0) + (transaction.taxes || 0))
    );
  }, 0);

  const mutualFundRealized = mutualFundTransactions.reduce((sum, transaction) => {
    if (transaction.transactionType === 'SELL') {
      return sum + transaction.totalAmount;
    }

    return sum - transaction.totalAmount;
  }, 0);

  const fnoRealized = fnoTrades
    .filter((trade) => trade.status === 'CLOSED')
    .reduce((sum, trade) => sum + trade.pnl, 0);

  const realizedPnl =
    stockRealized +
    mutualFundRealized +
    fnoRealized +
    activeBonds.reduce((sum, bond) => sum + bond.pnl, 0);

  const stockPnl = activeStocks.reduce((sum, stock) => sum + stock.pnl, 0);
  const mutualFundPnl = mutualFundsValue - mutualFundInvestment;
  const bondPnl = bondsValue - bondInvestment;
  const totalUnrealizedPnl = stockPnl + mutualFundPnl + bondPnl;

  const stockDayChange = activeStocks.reduce((sum, stock) => {
    return (
      sum + (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity
    );
  }, 0);

  const mutualFundDayChange = mutualFunds.reduce((sum, fund) => {
    return sum + (fund.currentNav - (fund.previousNav ?? fund.currentNav)) * fund.units;
  }, 0);

  const todayMovement = stockDayChange + mutualFundDayChange;

  const netMovement = transactions
    .filter((transaction) => !isTransferTransaction(transaction))
    .reduce((sum, transaction) => sum + getTransactionSignedAmount(transaction), 0);

  return {
    liquidityINR,
    stocksValue,
    mutualFundsValue,
    bondsValue,
    totalNetWorth: liquidityINR + stocksValue + mutualFundsValue + bondsValue,
    totalInvestment,
    realizedPnl,
    totalUnrealizedPnl,
    todayMovement,
    netMovement,
  };
}
