'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { supabase } from '../../lib/config/supabase';
import type { Database } from '../../lib/types/database.types';
import { useAuth } from './AuthContext';
import {
  Account,
  Transaction,
  Goal,
  Stock,
  StockTransaction,
  Watchlist,
  MutualFund,
  MutualFundTransaction,
  FnoTrade,
  AppSettings,
  FamilyTransfer,
  FinanceContextState,
} from '@/lib/types';
import { logError, logInfo, logWarn } from '../../lib/utils/logger';
import {
  dbAccountToAccount,
  dbTransactionToTransaction,
  dbGoalToGoal,
  dbFamilyTransferToFamilyTransfer,
  dbStockToStock,
  dbStockTransactionToStockTransaction,
  dbMutualFundToMutualFund,
  dbMutualFundTransactionToMutualFundTransaction,
  dbFnoTradeToFnoTrade,
  dbSettingsToSettings,
  AppSettingsRow,
} from '../../lib/utils/db-converters';

// NOTE: All tables (fno_trades, stock_transactions,
// mutual_fund_transactions) are fully present in database.types.ts
// and the client is typed as createClient<Database> — no any-casts needed.

const FinanceContext = createContext<FinanceContextState | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [familyTransfers, setFamilyTransfers] = useState<FamilyTransfer[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [watchlist, _setWatchlist] = useState<Watchlist[]>([]);
  const [mutualFunds, setMutualFunds] = useState<MutualFund[]>([]);
  const [mutualFundTransactions, setMutualFundTransactions] = useState<MutualFundTransaction[]>([]);
  const [fnoTrades, setFnoTrades] = useState<FnoTrade[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    brokerageType: 'flat',
    brokerageValue: 0,
    sttRate: 0.1,
    transactionChargeRate: 0.00297,
    sebiChargeRate: 0.0001,
    stampDutyRate: 0.015,
    gstRate: 18,
    dpCharges: 15.93,
    autoCalculateCharges: true,
    stocksVisible: true,
    mutualFundsVisible: true,
    fnoVisible: true,
    ledgerVisible: true,
    incomeVisible: true,
    expensesVisible: true,
    goalsVisible: true,
    familyVisible: true,
  });
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Ref to always hold latest refreshLivePrices â€” prevents interval from resetting on every price update
  const refreshLivePricesRef = useRef<(silent?: boolean) => Promise<void>>(async () => {});
  // Track the last date prices were refreshed to detect new trading days
  const lastRefreshDateRef = useRef<string>('');

  // â”€â”€â”€ GENERIC HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Generic delete helper to reduce repetitive CRUD boilerplate
  // Uses useCallback pattern (not useMemo) â€” memoises the async function correctly
  function makeDeleteFromTable<T extends { id: number }>(
    table: keyof Database['public']['Tables'],
    label: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    return async (id: number) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        logError(`Error deleting ${label}:`, error);
        throw error;
      }
      setter((prev) => prev.filter((item) => item.id !== id));
    };
  }

  // â”€â”€â”€ REFRESH HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const refreshAccounts = useCallback(async () => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) logError('Error refreshing accounts:', error);
    else setAccounts(data.map(dbAccountToAccount));
  }, []);

  // Refresh transactions (ledger) - called after investment ops since DB triggers create ledger entries
  const refreshTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);
    if (error) logError('Error refreshing transactions:', error);
    else setTransactions(data.map(dbTransactionToTransaction));
  }, []);

  const refreshPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const [stockResult, mfResult, fnoResult] = await Promise.allSettled([
        supabase.from('stocks').select('*'),
        supabase.from('mutual_funds').select('*'),
        supabase.from('fno_trades').select('*'),
      ]);

      if (stockResult.status === 'fulfilled' && stockResult.value.data)
        setStocks(stockResult.value.data.map(dbStockToStock));
      else if (stockResult.status === 'rejected')
        logError('Error refreshing stocks:', stockResult.reason);

      if (mfResult.status === 'fulfilled' && mfResult.value.data)
        setMutualFunds(mfResult.value.data.map(dbMutualFundToMutualFund));
      else if (mfResult.status === 'rejected')
        logError('Error refreshing mutual funds:', mfResult.reason);

      if (fnoResult.status === 'fulfilled' && fnoResult.value.data)
        setFnoTrades(fnoResult.value.data.map(dbFnoTradeToFnoTrade));
      else if (fnoResult.status === 'rejected') logError('Error refreshing F&O:', fnoResult.reason);

      logInfo('Portfolio refreshed successfully');
    } catch (err) {
      logError('Error refreshing portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // â”€â”€â”€ ACCOUNTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addTransaction = useCallback(
    async (transactionData: Omit<Transaction, 'id'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          date: transactionData.date,
          description: transactionData.description,
          category: transactionData.category,
          type: transactionData.type,
          amount: transactionData.amount,
          account_id: transactionData.accountId || null,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding transaction:', error);
        throw error;
      }

      const newTransaction = dbTransactionToTransaction(data);
      setTransactions((prev) => [newTransaction, ...prev]);
      refreshAccounts();
    },
    [refreshAccounts]
  );

  const updateTransaction = useCallback(
    async (id: number, transaction: Partial<Transaction>) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: transaction.date,
          description: transaction.description,
          category: transaction.category,
          type: transaction.type,
          amount: transaction.amount,
          account_id: transaction.accountId || null,
        })
        .eq('id', id);

      if (error) {
        logError('Error updating transaction:', error);
        throw error;
      }

      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...transaction } : t)));
      refreshAccounts();
    },
    [refreshAccounts]
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) {
        logError('Error deleting transaction:', error);
        throw error;
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      refreshAccounts();
    },
    [refreshAccounts]
  );

  const addAccount = useCallback(async (account: Omit<Account, 'id'>) => {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: account.name,
        bank_name: account.bankName,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
      })
      .select()
      .single();

    if (error) {
      logError('Error adding account:', error);
      throw error;
    }

    setAccounts((prev) => [...prev, dbAccountToAccount(data)]);
  }, []);

  const updateAccount = useCallback(async (id: number, account: Partial<Account>) => {
    const { error } = await supabase
      .from('accounts')
      .update({
        name: account.name,
        bank_name: account.bankName,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
      })
      .eq('id', id);

    if (error) {
      logError('Error updating account:', error);
      throw error;
    }

    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...account } : a)));
  }, []);

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteAccount = useCallback(
    (id: number) => makeDeleteFromTable('accounts', 'account', setAccounts)(id),

    []
  );

  const addFunds = useCallback(
    async (
      accountId: number,
      amount: number,
      description: string = 'Add Funds',
      category: string = 'Income'
    ) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          amount: amount,
          description: description,
          category: category,
          type: 'Income',
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        logError('Error adding funds (transaction):', error);
        throw error;
      }

      const newTx = dbTransactionToTransaction(data);
      setTransactions((prev) => [newTx, ...prev]);
      refreshAccounts();
    },
    [refreshAccounts]
  );

  // â”€â”€â”€ SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      if (user) {
        const { error } = await supabase
          .from('app_settings')
          .update({
            display_name: updatedSettings.displayName || null,
            brokerage_type: updatedSettings.brokerageType,
            brokerage_value: updatedSettings.brokerageValue,
            stt_rate: updatedSettings.sttRate,
            transaction_charge_rate: updatedSettings.transactionChargeRate,
            sebi_charge_rate: updatedSettings.sebiChargeRate,
            stamp_duty_rate: updatedSettings.stampDutyRate,
            gst_rate: updatedSettings.gstRate,
            dp_charges: updatedSettings.dpCharges,
            auto_calculate_charges: updatedSettings.autoCalculateCharges,
            default_stock_account_id: updatedSettings.defaultStockAccountId,
            default_mf_account_id: updatedSettings.defaultMfAccountId,
            default_salary_account_id: updatedSettings.defaultSalaryAccountId,
            stocks_visible: updatedSettings.stocksVisible,
            mutual_funds_visible: updatedSettings.mutualFundsVisible,
            fno_visible: updatedSettings.fnoVisible,
            ledger_visible: updatedSettings.ledgerVisible,
            income_visible: updatedSettings.incomeVisible,
            expenses_visible: updatedSettings.expensesVisible,
            goals_visible: updatedSettings.goalsVisible,
            family_visible: updatedSettings.familyVisible,
          })
          .eq('user_id', user.id);

        if (error) logError('Error updating settings:', error);
      }
    },
    [settings, user]
  );

  // â”€â”€â”€ STOCKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addStock = useCallback(
    async (stock: Omit<Stock, 'id'>) => {
      const { data, error } = await supabase
        .from('stocks')
        .insert({
          user_id: user?.id,
          symbol: stock.symbol,
          company_name: stock.companyName,
          quantity: stock.quantity,
          avg_price: stock.avgPrice,
          current_price: stock.currentPrice,
          previous_price: stock.previousPrice ?? stock.currentPrice,
          exchange: stock.exchange,
          sector: stock.sector,
          investment_amount: stock.investmentAmount,
          current_value: stock.currentValue,
          pnl: stock.pnl,
          pnl_percentage: stock.pnlPercentage,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding stock:', error);
        throw error;
      }

      const newStock = dbStockToStock(data);
      setStocks((prev) => [...prev, newStock]);
      return newStock;
    },
    [user]
  );

  const updateStock = useCallback(async (id: number, stock: Partial<Stock>) => {
    const { error } = await supabase
      .from('stocks')
      .update({
        symbol: stock.symbol,
        company_name: stock.companyName,
        quantity: stock.quantity,
        avg_price: stock.avgPrice,
        current_price: stock.currentPrice,
        previous_price: stock.previousPrice,
        exchange: stock.exchange,
        sector: stock.sector,
        investment_amount: stock.investmentAmount,
        current_value: stock.currentValue,
        pnl: stock.pnl,
        pnl_percentage: stock.pnlPercentage,
      })
      .eq('id', id);

    if (error) {
      logError('Error updating stock:', error);
      throw error;
    }

    setStocks((prev) => prev.map((s) => (s.id === id ? { ...s, ...stock } : s)));
  }, []);

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteStock = useCallback(
    (id: number) => makeDeleteFromTable('stocks', 'stock', setStocks)(id),

    []
  );

  const addStockTransaction = useCallback(
    async (tx: Omit<StockTransaction, 'id'>) => {
      const { data, error } = await supabase
        .from('stock_transactions')
        .insert({
          ...(user?.id ? { user_id: user.id } : {}),
          stock_id: tx.stockId,
          transaction_type: tx.transactionType,
          quantity: tx.quantity,
          price: tx.price,
          total_amount: tx.totalAmount,
          brokerage: tx.brokerage,
          taxes: tx.taxes,
          transaction_date: tx.transactionDate,
          notes: tx.notes,
          account_id: tx.accountId,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding stock transaction:', error);
        throw error;
      }

      setStockTransactions((prev) => [dbStockTransactionToStockTransaction(data), ...prev]);
      // DB trigger creates ledger entry + updates account balance + updates stock holdings
      refreshAccounts();
      refreshTransactions();
      refreshPortfolio();
    },
    [user, refreshAccounts, refreshTransactions, refreshPortfolio]
  );

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteStockTransaction = useCallback(
    (id: number) =>
      makeDeleteFromTable('stock_transactions', 'stock transaction', setStockTransactions)(id),

    []
  );

  // â”€â”€â”€ MUTUAL FUNDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addMutualFund = useCallback(
    async (mf: Omit<MutualFund, 'id'>) => {
      const { data, error } = await supabase
        .from('mutual_funds')
        .insert({
          user_id: user?.id,
          name: mf.schemeName,
          scheme_code: mf.schemeCode,
          category: mf.category,
          units: mf.units,
          avg_nav: mf.avgNav,
          current_nav: mf.currentNav,
          previous_nav: mf.previousNav ?? mf.currentNav,
          investment_amount: mf.investmentAmount,
          current_value: mf.currentValue,
          pnl: mf.pnl,
          pnl_percentage: mf.pnlPercentage,
          isin: mf.isin,
          folio_number: mf.folioNumber,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding mutual fund:', error);
        throw error;
      }

      const newMf = dbMutualFundToMutualFund(data);
      setMutualFunds((prev) => [...prev, newMf]);
      return newMf;
    },
    [user]
  );

  const updateMutualFund = useCallback(async (id: number, mf: Partial<MutualFund>) => {
    const { error } = await supabase
      .from('mutual_funds')
      .update({
        name: mf.schemeName,
        scheme_code: mf.schemeCode,
        category: mf.category,
        units: mf.units,
        avg_nav: mf.avgNav,
        current_nav: mf.currentNav,
        previous_nav: mf.previousNav,
        investment_amount: mf.investmentAmount,
        current_value: mf.currentValue,
        pnl: mf.pnl,
        pnl_percentage: mf.pnlPercentage,
        isin: mf.isin,
        folio_number: mf.folioNumber,
      })
      .eq('id', id);

    if (error) {
      logError('Error updating mutual fund:', error);
      throw error;
    }

    setMutualFunds((prev) => prev.map((m) => (m.id === id ? { ...m, ...mf } : m)));
  }, []);

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteMutualFund = useCallback(
    (id: number) => makeDeleteFromTable('mutual_funds', 'mutual fund', setMutualFunds)(id),

    []
  );

  const addMutualFundTransaction = useCallback(
    async (tx: Omit<MutualFundTransaction, 'id'>) => {
      const { data, error } = await supabase
        .from('mutual_fund_transactions')
        .insert({
          ...(user?.id ? { user_id: user.id } : {}),
          mutual_fund_id: tx.mutualFundId,
          transaction_type: tx.transactionType,
          units: tx.units,
          nav: tx.nav,
          total_amount: tx.totalAmount,
          transaction_date: tx.transactionDate,
          account_id: tx.accountId,
          notes: tx.notes,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding mutual fund transaction:', error);
        throw error;
      }

      setMutualFundTransactions((prev) => [
        dbMutualFundTransactionToMutualFundTransaction(data),
        ...prev,
      ]);
      // DB trigger creates ledger entry + updates account balance + updates mf holdings
      refreshAccounts();
      refreshTransactions();
      refreshPortfolio();
    },
    [user, refreshAccounts, refreshTransactions, refreshPortfolio]
  );

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteMutualFundTransaction = useCallback(
    (id: number) =>
      makeDeleteFromTable(
        'mutual_fund_transactions',
        'mutual fund transaction',
        setMutualFundTransactions
      )(id),

    []
  );

  // â”€â”€â”€ F&O â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addFnoTrade = useCallback(
    async (trade: Omit<FnoTrade, 'id'>) => {
      const { data, error } = await supabase
        .from('fno_trades')
        .insert({
          ...(user?.id ? { user_id: user.id } : {}),
          instrument: trade.instrument,
          trade_type: trade.tradeType,
          product: trade.product,
          quantity: trade.quantity,
          avg_price: trade.avgPrice,
          exit_price: trade.exitPrice,
          entry_date: trade.entryDate,
          exit_date: trade.exitDate,
          status: trade.status,
          pnl: trade.pnl,
          notes: trade.notes,
          account_id: trade.accountId,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding fno trade:', error);
        throw error;
      }

      setFnoTrades((prev) => [dbFnoTradeToFnoTrade(data), ...prev]);
      // DB trigger creates ledger entry + updates account balance
      refreshAccounts();
      refreshTransactions();
      refreshPortfolio();
    },
    [user, refreshAccounts, refreshTransactions, refreshPortfolio]
  );

  const updateFnoTrade = useCallback(
    async (id: number, trade: Partial<FnoTrade>) => {
      const { error } = await supabase
        .from('fno_trades')
        .update({
          instrument: trade.instrument,
          trade_type: trade.tradeType,
          product: trade.product,
          quantity: trade.quantity,
          avg_price: trade.avgPrice,
          exit_price: trade.exitPrice,
          entry_date: trade.entryDate,
          exit_date: trade.exitDate,
          status: trade.status,
          pnl: trade.pnl,
          notes: trade.notes,
          account_id: trade.accountId,
        })
        .eq('id', id);

      if (error) {
        logError('Error updating fno trade:', error);
        throw error;
      }

      setFnoTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...trade } : t)));
      // DB trigger fires on OPENâ†’CLOSED status change: creates ledger entry + updates balance
      if (trade.status === 'CLOSED') {
        refreshAccounts();
        refreshTransactions();
        refreshPortfolio();
      }
    },
    [refreshAccounts, refreshTransactions, refreshPortfolio]
  );

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteFnoTrade = useCallback(
    (id: number) => makeDeleteFromTable('fno_trades', 'fno trade', setFnoTrades)(id),

    []
  );

  // â”€â”€â”€ GOALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addGoal = useCallback(
    async (goal: Omit<Goal, 'id'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user?.id,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          deadline: goal.deadline,
          category: goal.category,
          description: goal.description,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding goal:', error);
        throw error;
      }

      setGoals((prev) => [...prev, dbGoalToGoal(data)]);
    },
    [user]
  );

  const updateGoal = useCallback(async (id: number, goal: Partial<Goal>) => {
    const { error } = await supabase
      .from('goals')
      .update({
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        deadline: goal.deadline,
        category: goal.category,
        description: goal.description,
      })
      .eq('id', id);

    if (error) {
      logError('Error updating goal:', error);
      throw error;
    }

    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...goal } : g)));
  }, []);

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteGoal = useCallback(
    (id: number) => makeDeleteFromTable('goals', 'goal', setGoals)(id),

    []
  );

  // â”€â”€â”€ FAMILY TRANSFERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addFamilyTransfer = useCallback(
    async (transfer: Omit<FamilyTransfer, 'id'>) => {
      const { data, error } = await supabase
        .from('family_transfers')
        .insert({
          user_id: user?.id,
          date: transfer.date,
          recipient: transfer.recipient,
          relationship: transfer.relationship,
          amount: transfer.amount,
          purpose: transfer.purpose || '',
          notes: transfer.notes,
          account_id: transfer.accountId,
        })
        .select()
        .single();

      if (error) {
        logError('Error adding family transfer:', error);
        throw error;
      }

      setFamilyTransfers((prev) => [...prev, dbFamilyTransferToFamilyTransfer(data)]);
      refreshAccounts();
    },
    [user, refreshAccounts]
  );

  const updateFamilyTransfer = useCallback(
    async (id: number, transfer: Partial<FamilyTransfer>) => {
      const { error } = await supabase
        .from('family_transfers')
        .update({
          date: transfer.date,
          recipient: transfer.recipient,
          relationship: transfer.relationship,
          amount: transfer.amount,
          purpose: transfer.purpose,
          notes: transfer.notes,
          account_id: transfer.accountId,
        })
        .eq('id', id);

      if (error) {
        logError('Error updating family transfer:', error);
        throw error;
      }

      setFamilyTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, ...transfer } : t)));
      refreshAccounts();
    },
    [refreshAccounts]
  );

  const deleteFamilyTransfer = useCallback(
    async (id: number) => {
      const { error } = await supabase.from('family_transfers').delete().eq('id', id);

      if (error) {
        logError('Error deleting family transfer:', error);
        throw error;
      }

      setFamilyTransfers((prev) => prev.filter((t) => t.id !== id));
      refreshAccounts();
    },
    [refreshAccounts]
  );

  // â”€â”€â”€ LIVE PRICE REFRESH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const refreshLivePrices = useCallback(
    async (silent: boolean = false) => {
      if (!silent) setLoading(true);

      // 1. Stocks
      try {
        const stockSymbols = [...new Set(stocks.map((s) => s.symbol))].filter(Boolean);
        if (stockSymbols.length > 0) {
          if (!silent) logInfo(`Fetching updates for ${stockSymbols.length} stocks...`);
          const res = await fetch(
            `/api/stocks/batch?symbols=${stockSymbols.join(',')}&t=${Date.now()}`
          );
          if (!res.ok) throw new Error(`Stock batch fetch failed: ${res.status}`);
          const updates = await res.json();
          if (updates && typeof updates === 'object' && !updates.error) {
            let updatedCount = 0;

            setStocks((prev) =>
              prev.map((stock) => {
                const cleanSymbol = stock.symbol.trim().toUpperCase();
                // Try exact match, then base match (without suffix)
                const update = updates[cleanSymbol] || updates[cleanSymbol.split('.')[0]];

                if (!update) {
                  return stock;
                }

                updatedCount++;
                const currentPrice = update.currentPrice;
                const apiPreviousClose = update.previousClose;

                // Always prefer the API's previousClose when it's a valid positive value.
                // This ensures day's P&L is always relative to the previous session's close
                // and resets correctly each trading day.
                const previousPrice =
                  apiPreviousClose > 0 ? apiPreviousClose : (stock.previousPrice ?? currentPrice);

                const currentValue = stock.quantity * currentPrice;
                const pnl = currentValue - stock.investmentAmount;
                const pnlPercentage =
                  stock.investmentAmount > 0 ? (pnl / stock.investmentAmount) * 100 : 0;

                if (currentPrice > 0) {
                  supabase
                    .from('stocks')
                    .update({
                      current_price: currentPrice,
                      previous_price: previousPrice,
                      current_value: currentValue,
                      pnl,
                      pnl_percentage: pnlPercentage,
                    })
                    .eq('id', stock.id)
                    .then(({ error }: { error: Error | null }) => {
                      if (error) logError(`Failed to persist stock ${stock.symbol}`, error);
                    });
                }

                return {
                  ...stock,
                  currentPrice: currentPrice > 0 ? currentPrice : stock.currentPrice,
                  previousPrice,
                  currentValue,
                  pnl,
                  pnlPercentage,
                };
              })
            );
            if (!silent) logInfo(`Updated ${updatedCount} stocks.`);
            if (updatedCount === 0 && !silent) logWarn('No stock prices updated. Check symbols.');
          }
        }
      } catch (err) {
        logError('Failed to refresh stock prices:', err);
      }

      // 2. Mutual Funds
      try {
        const mfCodes = [...new Set(mutualFunds.map((m) => m.schemeCode))].filter(Boolean);
        if (mfCodes.length > 0) {
          if (!silent) logInfo(`Fetching NAVs for ${mfCodes.length} mutual funds...`);
          const res = await fetch(`/api/mf/batch?codes=${mfCodes.join(',')}&t=${Date.now()}`);
          if (!res.ok) throw new Error(`MF batch fetch failed: ${res.status}`);
          const updates = await res.json();
          if (updates && typeof updates === 'object' && !updates.error) {
            let updatedCount = 0;

            setMutualFunds((prev) =>
              prev.map((mf) => {
                const update = updates[mf.schemeCode];
                if (!update) {
                  return mf;
                }

                updatedCount++;
                const currentNav = update.currentNav;
                // Always prefer the API's previousNav when valid, so day's P&L resets daily.
                const previousNav =
                  update.previousNav > 0 ? update.previousNav : (mf.previousNav ?? currentNav);
                const currentValue = mf.units * currentNav;
                const pnl = currentValue - mf.investmentAmount;
                const pnlPercentage =
                  mf.investmentAmount > 0 ? (pnl / mf.investmentAmount) * 100 : 0;

                if (currentNav > 0) {
                  supabase
                    .from('mutual_funds')
                    .update({
                      current_nav: currentNav,
                      previous_nav: previousNav,
                      current_value: currentValue,
                      pnl,
                      pnl_percentage: pnlPercentage,
                    })
                    .eq('id', mf.id)
                    .then(({ error }: { error: Error | null }) => {
                      if (error) logError(`Failed to persist MF ${mf.schemeName}`, error);
                    });
                }

                return {
                  ...mf,
                  currentNav,
                  previousNav,
                  currentValue,
                  pnl,
                  pnlPercentage,
                };
              })
            );
            if (!silent) logInfo(`Updated ${updatedCount} mutual funds.`);
          }
        }
      } catch (err) {
        logError('Failed to refresh MF NAVs:', err);
      }

      if (!silent) setLoading(false);
      logInfo('Live prices refresh completed');
    },
    [stocks, mutualFunds]
  );

  // Keep the ref always pointing at the latest version of refreshLivePrices
  // This is key to the interval fix â€” the interval closure captures the ref, not the function
  useEffect(() => {
    refreshLivePricesRef.current = refreshLivePrices;
  }, [refreshLivePrices]);

  // â”€â”€â”€ INITIAL DATA LOAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) {
        if (!authLoading) setLoading(false);
        return;
      }

      try {
        // FIX: Promise.allSettled â€” individual query failures no longer abort all data loading
        const [
          accResult,
          txResult,
          settingsResult,
          stockResult,
          mfResult,
          goalResult,
          familyResult,
          fnoResult,
          stockTxResult,
          mfTxResult,
        ] = await Promise.allSettled([
          supabase.from('accounts').select('*').order('name'),
          supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100),
          supabase.from('app_settings').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('stocks').select('*'),
          supabase.from('mutual_funds').select('*'),
          supabase.from('goals').select('*'),
          supabase.from('family_transfers').select('*'),
          supabase.from('fno_trades').select('*'),
          supabase
            .from('stock_transactions')
            .select('*')
            .order('transaction_date', { ascending: false }),
          supabase
            .from('mutual_fund_transactions')
            .select('*')
            .order('transaction_date', { ascending: false }),
        ]);

        // Apply each result independently â€” partial failures are tolerated
        if (accResult.status === 'fulfilled' && accResult.value.data)
          setAccounts(accResult.value.data.map(dbAccountToAccount));
        else if (accResult.status === 'rejected')
          logError('Failed to load accounts:', accResult.reason);

        if (txResult.status === 'fulfilled' && txResult.value.data)
          setTransactions(txResult.value.data.map(dbTransactionToTransaction));
        else if (txResult.status === 'rejected')
          logError('Failed to load transactions:', txResult.reason);

        if (settingsResult.status === 'fulfilled' && settingsResult.value.data)
          setSettings(dbSettingsToSettings(settingsResult.value.data as AppSettingsRow));
        else if (settingsResult.status === 'rejected')
          logError('Failed to load settings:', settingsResult.reason);

        if (stockResult.status === 'fulfilled' && stockResult.value.data)
          setStocks(stockResult.value.data.map(dbStockToStock));
        else if (stockResult.status === 'rejected')
          logError('Failed to load stocks:', stockResult.reason);

        if (mfResult.status === 'fulfilled' && mfResult.value.data)
          setMutualFunds(mfResult.value.data.map(dbMutualFundToMutualFund));
        else if (mfResult.status === 'rejected')
          logError('Failed to load mutual funds:', mfResult.reason);

        if (goalResult.status === 'fulfilled' && goalResult.value.data)
          setGoals(goalResult.value.data.map(dbGoalToGoal));
        else if (goalResult.status === 'rejected')
          logError('Failed to load goals:', goalResult.reason);

        if (familyResult.status === 'fulfilled' && familyResult.value.data)
          setFamilyTransfers(familyResult.value.data.map(dbFamilyTransferToFamilyTransfer));
        else if (familyResult.status === 'rejected')
          logError('Failed to load family transfers:', familyResult.reason);

        if (fnoResult.status === 'fulfilled' && fnoResult.value.data)
          setFnoTrades(fnoResult.value.data.map(dbFnoTradeToFnoTrade));
        else if (fnoResult.status === 'rejected')
          logError('Failed to load F&O trades:', fnoResult.reason);

        if (stockTxResult.status === 'fulfilled' && stockTxResult.value.data)
          setStockTransactions(stockTxResult.value.data.map(dbStockTransactionToStockTransaction));
        else if (stockTxResult.status === 'rejected')
          logError('Failed to load stock transactions:', stockTxResult.reason);

        if (mfTxResult.status === 'fulfilled' && mfTxResult.value.data)
          setMutualFundTransactions(
            mfTxResult.value.data.map(dbMutualFundTransactionToMutualFundTransaction)
          );
        else if (mfTxResult.status === 'rejected')
          logError('Failed to load MF transactions:', mfTxResult.reason);

        setLoading(false);
      } catch (err) {
        logError('Failed to load initial data:', err);
        setError('Failed to load financial data');
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, authLoading]);

  // â”€â”€â”€ MEMOISED CONTEXT VALUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const value = useMemo(
    () => ({
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
      addFunds,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      stocks,
      addStock,
      updateStock,
      deleteStock,
      stockTransactions,
      addStockTransaction,
      deleteStockTransaction,
      watchlist,
      mutualFunds,
      addMutualFund,
      updateMutualFund,
      deleteMutualFund,
      mutualFundTransactions,
      addMutualFundTransaction,
      deleteMutualFundTransaction,
      fnoTrades,
      addFnoTrade,
      updateFnoTrade,
      deleteFnoTrade,
      familyTransfers,
      addFamilyTransfer,
      updateFamilyTransfer,
      deleteFamilyTransfer,
      settings,
      updateSettings,
      loading,
      error,
      refreshPortfolio,
      isTransactionModalOpen,
      setIsTransactionModalOpen,
      refreshLivePrices,
    }),
    [
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
      addFunds,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      stocks,
      addStock,
      updateStock,
      deleteStock,
      stockTransactions,
      addStockTransaction,
      deleteStockTransaction,
      watchlist,
      mutualFunds,
      addMutualFund,
      updateMutualFund,
      deleteMutualFund,
      mutualFundTransactions,
      addMutualFundTransaction,
      deleteMutualFundTransaction,
      fnoTrades,
      addFnoTrade,
      updateFnoTrade,
      deleteFnoTrade,
      familyTransfers,
      addFamilyTransfer,
      updateFamilyTransfer,
      deleteFamilyTransfer,
      settings,
      updateSettings,
      loading,
      error,
      refreshPortfolio,
      isTransactionModalOpen,
      setIsTransactionModalOpen,
      refreshLivePrices,
    ]
  );

  // â”€â”€â”€ LIVE PRICE EFFECTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Automatic initial refresh after data loads (once)
  const dataLoaded = !loading;
  useEffect(() => {
    if (dataLoaded && (stocks.length > 0 || mutualFunds.length > 0)) {
      const timeout = setTimeout(() => {
        refreshLivePricesRef.current(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [dataLoaded, stocks.length, mutualFunds.length]);

  // Periodic refresh: uses ref so the interval is NOT reset on every price update.
  // Also detects new trading days: if the calendar date has changed since the last
  // refresh, an immediate refresh is triggered so previousClose resets correctly.
  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (!lastRefreshDateRef.current) lastRefreshDateRef.current = today;
      if (lastRefreshDateRef.current !== today) {
        // New trading day detected — refresh to get updated previousClose values
        lastRefreshDateRef.current = today;
      }
      refreshLivePricesRef.current(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [user]); // only resets when user logs in/out

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
