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
  Bond,
  BondTransaction,
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
  dbBondToBond,
  dbBondTransactionToBondTransaction,
  AppSettingsRow,
} from '../../lib/utils/db-converters';

// NOTE: All tables (fno_trades, stock_transactions,
// mutual_fund_transactions) are fully present in database.types.ts
// and the client is typed as createClient<Database> — no any-casts needed.

const FinanceContext = createContext<FinanceContextState | undefined>(undefined);
export const LedgerContext = createContext<FinanceContextState | undefined>(undefined);
export const PortfolioContext = createContext<FinanceContextState | undefined>(undefined);
export const SettingsContext = createContext<FinanceContextState | undefined>(undefined);

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('useLedger must be used within FinanceProvider');
  return context;
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within FinanceProvider');
  return context;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within FinanceProvider');
  return context;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

const ACCOUNT_SELECT_FIELDS = 'id,name,bank_name,type,balance,currency';
const TRANSACTION_SELECT_FIELDS = 'id,date,description,category,type,amount,account_id';
const GOAL_SELECT_FIELDS = 'id,name,target_amount,current_amount,deadline,category,description';
const FAMILY_TRANSFER_SELECT_FIELDS =
  'id,date,recipient,relationship,amount,purpose,notes,account_id';
const STOCK_SELECT_FIELDS =
  'id,symbol,company_name,quantity,avg_price,current_price,sector,exchange,investment_amount,current_value,pnl,pnl_percentage,previous_price';
const STOCK_TRANSACTION_SELECT_FIELDS =
  'id,stock_id,transaction_type,quantity,price,total_amount,brokerage,taxes,transaction_date,notes,account_id';
const MUTUAL_FUND_SELECT_FIELDS =
  'id,name,scheme_code,category,units,avg_nav,current_nav,investment_amount,current_value,pnl,pnl_percentage,folio_number,isin,previous_nav';
const MUTUAL_FUND_TRANSACTION_SELECT_FIELDS =
  'id,mutual_fund_id,transaction_type,units,nav,total_amount,transaction_date,notes,account_id';
const FNO_TRADE_SELECT_FIELDS =
  'id,instrument,trade_type,product,quantity,avg_price,exit_price,entry_date,exit_date,status,pnl,notes,account_id';
const BOND_SELECT_FIELDS =
  'id,name,company_name,isin,quantity,avg_price,current_price,coupon_rate,maturity_date,status,investment_amount,current_value,pnl,pnl_percentage,yield_to_maturity';
const BOND_TRANSACTION_SELECT_FIELDS =
  'id,bond_id,transaction_type,quantity,price,total_amount,transaction_date,notes,account_id';
const SETTINGS_SELECT_FIELDS =
  'user_id,display_name,brokerage_type,brokerage_value,stt_rate,transaction_charge_rate,sebi_charge_rate,stamp_duty_rate,gst_rate,dp_charges,auto_calculate_charges,default_stock_account_id,default_mf_account_id,default_salary_account_id,stocks_visible,mutual_funds_visible,fno_visible,ledger_visible,income_visible,expenses_visible,goals_visible,family_visible,bonds_enabled,forex_enabled';

type SupabaseLoadResult<T> = PromiseSettledResult<{
  data: T | null;
  error: unknown;
}>;

const getSettledQueryData = <T,>(result: SupabaseLoadResult<T>, label: string): T | null => {
  if (result.status === 'rejected') {
    logError(`Failed to load ${label}:`, result.reason);
    return null;
  }

  if (result.value.error) {
    logError(`Failed to load ${label}:`, result.value.error);
    return null;
  }

  return result.value.data;
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
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [bondTransactions, setBondTransactions] = useState<BondTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    displayName: '',
    brokerageType: 'flat',
    brokerageValue: 0,
    sttRate: 0.1,
    transactionChargeRate: 0.00307,
    sebiChargeRate: 0.0001,
    stampDutyRate: 0.015,
    gstRate: 18,
    dpCharges: 15.34,
    autoCalculateCharges: true,
    stocksVisible: true,
    mutualFundsVisible: true,
    fnoVisible: true,
    ledgerVisible: true,
    incomeVisible: true,
    expensesVisible: true,
    goalsVisible: true,
    familyVisible: true,
    bondsVisible: true,
    forexVisible: true,
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
    const { data, error } = await supabase
      .from('accounts')
      .select(ACCOUNT_SELECT_FIELDS)
      .order('name');
    if (error) logError('Error refreshing accounts:', error);
    else setAccounts(data.map(dbAccountToAccount));
  }, []);

  // Refresh transactions (ledger) - called after investment ops since DB triggers create ledger entries
  const refreshTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT_FIELDS)
      .order('date', { ascending: false })
      .limit(100);
    if (error) logError('Error refreshing transactions:', error);
    else setTransactions(data.map(dbTransactionToTransaction));
  }, []);

  const refreshPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const [stockResult, mfResult, fnoResult, bondResult] = await Promise.allSettled([
        supabase.from('stocks').select(STOCK_SELECT_FIELDS),
        supabase.from('mutual_funds').select(MUTUAL_FUND_SELECT_FIELDS),
        supabase.from('fno_trades').select(FNO_TRADE_SELECT_FIELDS),
        supabase.from('bonds').select(BOND_SELECT_FIELDS),
      ]);

      const stockData = getSettledQueryData(stockResult, 'stocks');
      if (stockData) setStocks(stockData.map(dbStockToStock));

      const mutualFundData = getSettledQueryData(mfResult, 'mutual funds');
      if (mutualFundData) setMutualFunds(mutualFundData.map(dbMutualFundToMutualFund));

      const fnoData = getSettledQueryData(fnoResult, 'F&O');
      if (fnoData) setFnoTrades(fnoData.map(dbFnoTradeToFnoTrade));

      const bondData = getSettledQueryData(bondResult, 'bonds');
      if (bondData) setBonds(bondData.map(dbBondToBond));

      logInfo('Portfolio refreshed successfully');
    } catch (err) {
      logError('Error refreshing portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLedgerState = useCallback(async () => {
    await Promise.allSettled([refreshAccounts(), refreshTransactions()]);
  }, [refreshAccounts, refreshTransactions]);

  const refreshInvestmentState = useCallback(async () => {
    await Promise.allSettled([refreshAccounts(), refreshTransactions(), refreshPortfolio()]);
  }, [refreshAccounts, refreshTransactions, refreshPortfolio]);

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
        .select(TRANSACTION_SELECT_FIELDS)
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
      .select(ACCOUNT_SELECT_FIELDS)
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
        .select(TRANSACTION_SELECT_FIELDS)
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

  // Keep a ref to latest settings to avoid stale closures in callbacks
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Debounced settings update to Supabase
  const pendingSettingsUpdate = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      // 1. Update local state immediately for UI responsiveness
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        settingsRef.current = updated; // Keep ref in sync too
        return updated;
      });

      // 2. Debounce the persistence call
      if (pendingSettingsUpdate.current) clearTimeout(pendingSettingsUpdate.current);

      pendingSettingsUpdate.current = setTimeout(async () => {
        if (!user) return;

        // Use the latest settings from the ref (which we just updated above)
        const updatedSettings = settingsRef.current;

        const { error } = await supabase.from('app_settings').upsert(
          {
            user_id: user.id,
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
            bonds_enabled: updatedSettings.bondsVisible,
            forex_enabled: updatedSettings.forexVisible,
          },
          { onConflict: 'user_id' }
        );

        if (error) logError('Error updating settings:', error);
        else logInfo('Settings persisted to cloud');
      }, 1000); // 1 second debounce
    },
    [user]
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
        .select(STOCK_SELECT_FIELDS)
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
    async (id: number) => {
      await makeDeleteFromTable('stocks', 'stock', setStocks)(id);
      setStockTransactions((prev) => prev.filter((tx) => tx.stockId !== id));
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
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
        .select(STOCK_TRANSACTION_SELECT_FIELDS)
        .single();

      if (error) {
        logError('Error adding stock transaction:', error);
        throw error;
      }

      setStockTransactions((prev) => [dbStockTransactionToStockTransaction(data), ...prev]);
      // DB trigger creates ledger entry + updates account balance + updates stock holdings
      void refreshInvestmentState();
    },
    [user, refreshInvestmentState]
  );

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteStockTransaction = useCallback(
    async (id: number) => {
      await makeDeleteFromTable(
        'stock_transactions',
        'stock transaction',
        setStockTransactions
      )(id);
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
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
        .select(MUTUAL_FUND_SELECT_FIELDS)
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
    async (id: number) => {
      await makeDeleteFromTable('mutual_funds', 'mutual fund', setMutualFunds)(id);
      setMutualFundTransactions((prev) => prev.filter((tx) => tx.mutualFundId !== id));
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
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
        .select(MUTUAL_FUND_TRANSACTION_SELECT_FIELDS)
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
      void refreshInvestmentState();
    },
    [user, refreshInvestmentState]
  );

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteMutualFundTransaction = useCallback(
    async (id: number) => {
      await makeDeleteFromTable(
        'mutual_fund_transactions',
        'mutual fund transaction',
        setMutualFundTransactions
      )(id);
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
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
        .select(FNO_TRADE_SELECT_FIELDS)
        .single();

      if (error) {
        logError('Error adding fno trade:', error);
        throw error;
      }

      setFnoTrades((prev) => [dbFnoTradeToFnoTrade(data), ...prev]);
      // DB trigger creates ledger entry + updates account balance
      void refreshInvestmentState();
    },
    [user, refreshInvestmentState]
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
        void refreshInvestmentState();
      }
    },
    [refreshInvestmentState]
  );

  // FIX: was useMemo â€” useCallback is semantically correct for functions
  const deleteFnoTrade = useCallback(
    async (id: number) => {
      await makeDeleteFromTable('fno_trades', 'fno trade', setFnoTrades)(id);
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
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
        .select(GOAL_SELECT_FIELDS)
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
        .select(FAMILY_TRANSFER_SELECT_FIELDS)
        .single();

      if (error) {
        logError('Error adding family transfer:', error);
        throw error;
      }

      setFamilyTransfers((prev) => [...prev, dbFamilyTransferToFamilyTransfer(data)]);
      void refreshLedgerState();
    },
    [user, refreshLedgerState]
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
      void refreshLedgerState();
    },
    [refreshLedgerState]
  );

  const deleteFamilyTransfer = useCallback(
    async (id: number) => {
      const { error } = await supabase.from('family_transfers').delete().eq('id', id);

      if (error) {
        logError('Error deleting family transfer:', error);
        throw error;
      }

      setFamilyTransfers((prev) => prev.filter((t) => t.id !== id));
      void refreshLedgerState();
    },
    [refreshLedgerState]
  );

  // ─── BONDS ──────────────────────────────────────────────────────────────────

  const addBond = useCallback(
    async (bond: Omit<Bond, 'id'>) => {
      if (!user) throw new Error('Authentication required');
      const { data, error } = await supabase
        .from('bonds')
        .insert({
          user_id: user.id,
          name: bond.name,
          company_name: bond.companyName,
          isin: bond.isin,
          quantity: bond.quantity,
          avg_price: bond.avgPrice,
          current_price: bond.currentPrice,
          coupon_rate: bond.couponRate,
          maturity_date: bond.maturityDate,
          status: bond.status,
          investment_amount: bond.investmentAmount,
          current_value: bond.currentValue,
          pnl: bond.pnl,
          pnl_percentage: bond.pnlPercentage,
          yield_to_maturity: bond.yieldToMaturity,
        })
        .select(BOND_SELECT_FIELDS)
        .single();

      if (error) {
        logError('Error adding bond:', error);
        throw error;
      }

      const newBond = dbBondToBond(data);
      setBonds((prev) => [...prev, newBond]);
      return newBond;
    },
    [user]
  );

  const updateBond = useCallback(async (id: number, bond: Partial<Bond>) => {
    const { error } = await supabase
      .from('bonds')
      .update({
        name: bond.name,
        company_name: bond.companyName,
        isin: bond.isin,
        quantity: bond.quantity,
        avg_price: bond.avgPrice,
        current_price: bond.currentPrice,
        coupon_rate: bond.couponRate,
        maturity_date: bond.maturityDate,
        status: bond.status,
        investment_amount: bond.investmentAmount,
        current_value: bond.currentValue,
        pnl: bond.pnl,
        pnl_percentage: bond.pnlPercentage,
        yield_to_maturity: bond.yieldToMaturity,
      })
      .eq('id', id);

    if (error) {
      logError('Error updating bond:', error);
      throw error;
    }

    setBonds((prev) => prev.map((b) => (b.id === id ? { ...b, ...bond } : b)));
  }, []);

  const deleteBond = useCallback(
    async (id: number) => {
      await makeDeleteFromTable('bonds', 'bond', setBonds)(id);
      setBondTransactions((prev) => prev.filter((tx) => tx.bondId !== id));
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
  );

  const addBondTransaction = useCallback(
    async (tx: Omit<BondTransaction, 'id'>) => {
      if (!user) throw new Error('Authentication required');
      const { data, error } = await supabase
        .from('bond_transactions')
        .insert({
          user_id: user.id,
          bond_id: tx.bondId,
          transaction_type: tx.transactionType,
          quantity: tx.quantity,
          price: tx.price,
          total_amount: tx.totalAmount,
          transaction_date: tx.transactionDate,
          notes: tx.notes,
          account_id: tx.accountId,
        })
        .select(BOND_TRANSACTION_SELECT_FIELDS)
        .single();

      if (error) {
        logError('Error adding bond transaction:', error);
        throw error;
      }

      setBondTransactions((prev) => [dbBondTransactionToBondTransaction(data), ...prev]);
      void refreshInvestmentState();
    },
    [user, refreshInvestmentState]
  );

  const deleteBondTransaction = useCallback(
    async (id: number) => {
      await makeDeleteFromTable('bond_transactions', 'bond transaction', setBondTransactions)(id);
      void refreshInvestmentState();
    },
    [refreshInvestmentState]
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
    let isActive = true;
    let didFinish = false;
    let dataTimeout: ReturnType<typeof setTimeout> | null = null;

    const loadInitialData = async () => {
      if (!user) {
        if (!authLoading) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Safety timeout for data loading (15 seconds)
      dataTimeout = setTimeout(() => {
        if (!didFinish && isActive) {
          logError('Initial data load timed out. Proceeding with partial/empty state.');
          setLoading(false);
        }
      }, 15000);

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
          bondResult,
          bondTxResult,
          stockTxResult,
          mfTxResult,
        ] = await Promise.allSettled([
          supabase.from('accounts').select(ACCOUNT_SELECT_FIELDS).order('name'),
          supabase
            .from('transactions')
            .select(TRANSACTION_SELECT_FIELDS)
            .order('date', { ascending: false })
            .limit(100),
          supabase
            .from('app_settings')
            .select(SETTINGS_SELECT_FIELDS)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.from('stocks').select(STOCK_SELECT_FIELDS),
          supabase.from('mutual_funds').select(MUTUAL_FUND_SELECT_FIELDS),
          supabase.from('goals').select(GOAL_SELECT_FIELDS),
          supabase.from('family_transfers').select(FAMILY_TRANSFER_SELECT_FIELDS),
          supabase.from('fno_trades').select(FNO_TRADE_SELECT_FIELDS),
          supabase.from('bonds').select(BOND_SELECT_FIELDS),
          supabase
            .from('bond_transactions')
            .select(BOND_TRANSACTION_SELECT_FIELDS)
            .order('transaction_date', { ascending: false }),
          supabase
            .from('stock_transactions')
            .select(STOCK_TRANSACTION_SELECT_FIELDS)
            .order('transaction_date', { ascending: false }),
          supabase
            .from('mutual_fund_transactions')
            .select(MUTUAL_FUND_TRANSACTION_SELECT_FIELDS)
            .order('transaction_date', { ascending: false }),
        ]);

        if (!isActive) {
          return;
        }

        // Apply each result independently â€” partial failures are tolerated
        const accountData = getSettledQueryData(accResult, 'accounts');
        if (accountData) setAccounts(accountData.map(dbAccountToAccount));

        const transactionData = getSettledQueryData(txResult, 'transactions');
        if (transactionData) setTransactions(transactionData.map(dbTransactionToTransaction));

        const settingsData = getSettledQueryData(settingsResult, 'settings');
        if (settingsData) setSettings(dbSettingsToSettings(settingsData as AppSettingsRow));

        const stockData = getSettledQueryData(stockResult, 'stocks');
        if (stockData) setStocks(stockData.map(dbStockToStock));

        const mutualFundData = getSettledQueryData(mfResult, 'mutual funds');
        if (mutualFundData) setMutualFunds(mutualFundData.map(dbMutualFundToMutualFund));

        const goalData = getSettledQueryData(goalResult, 'goals');
        if (goalData) setGoals(goalData.map(dbGoalToGoal));

        const familyTransferData = getSettledQueryData(familyResult, 'family transfers');
        if (familyTransferData)
          setFamilyTransfers(familyTransferData.map(dbFamilyTransferToFamilyTransfer));

        const fnoData = getSettledQueryData(fnoResult, 'F&O trades');
        if (fnoData) setFnoTrades(fnoData.map(dbFnoTradeToFnoTrade));

        const bondData = getSettledQueryData(bondResult, 'bonds');
        if (bondData) setBonds(bondData.map(dbBondToBond));

        const bondTransactionData = getSettledQueryData(bondTxResult, 'bond transactions');
        if (bondTransactionData)
          setBondTransactions(bondTransactionData.map(dbBondTransactionToBondTransaction));

        const stockTransactionData = getSettledQueryData(stockTxResult, 'stock transactions');
        if (stockTransactionData)
          setStockTransactions(stockTransactionData.map(dbStockTransactionToStockTransaction));

        const mutualFundTransactionData = getSettledQueryData(
          mfTxResult,
          'mutual fund transactions'
        );
        if (mutualFundTransactionData)
          setMutualFundTransactions(
            mutualFundTransactionData.map(dbMutualFundTransactionToMutualFundTransaction)
          );

        didFinish = true;
        setLoading(false);
        if (dataTimeout) clearTimeout(dataTimeout);
      } catch (err) {
        if (!isActive) {
          return;
        }
        logError('Failed to load initial data:', err);
        setError('Failed to load financial data');
        didFinish = true;
        setLoading(false);
        if (dataTimeout) clearTimeout(dataTimeout);
      }
    };

    void loadInitialData();

    return () => {
      isActive = false;
      if (dataTimeout) clearTimeout(dataTimeout);
    };
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
      bonds,
      addBond,
      updateBond,
      deleteBond,
      bondTransactions,
      addBondTransaction,
      deleteBondTransaction,
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
      bonds,
      addBond,
      updateBond,
      deleteBond,
      bondTransactions,
      addBondTransaction,
      deleteBondTransaction,
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
    // 5 minute interval (reduced from 1 minute to cut unnecessary API calls)
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
    let intervalId: ReturnType<typeof setInterval>;

    const startPolling = () => {
      intervalId = setInterval(() => {
        const today = new Date().toISOString().split('T')[0];
        if (!lastRefreshDateRef.current) lastRefreshDateRef.current = today;
        if (lastRefreshDateRef.current !== today) {
          // New trading day detected — refresh to get updated previousClose values
          lastRefreshDateRef.current = today;
        }
        refreshLivePricesRef.current(true);
      }, REFRESH_INTERVAL_MS);
    };

    const stopPolling = () => {
      clearInterval(intervalId);
    };

    // Pause polling when user switches away from the tab (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Refresh immediately when user returns, then resume interval
        refreshLivePricesRef.current(true);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]); // only resets when user logs in/out

  const ledgerValue = useMemo(
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
      familyTransfers,
      addFamilyTransfer,
      updateFamilyTransfer,
      deleteFamilyTransfer,
      isTransactionModalOpen,
      setIsTransactionModalOpen,
      loading,
      error,
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
      familyTransfers,
      addFamilyTransfer,
      updateFamilyTransfer,
      deleteFamilyTransfer,
      isTransactionModalOpen,
      setIsTransactionModalOpen,
      loading,
      error,
    ]
  );

  const portfolioValue = useMemo(
    () => ({
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
      bonds,
      addBond,
      updateBond,
      deleteBond,
      bondTransactions,
      addBondTransaction,
      deleteBondTransaction,
      refreshPortfolio,
      refreshLivePrices,
      loading,
      error,
    }),
    [
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
      bonds,
      addBond,
      updateBond,
      deleteBond,
      bondTransactions,
      addBondTransaction,
      deleteBondTransaction,
      refreshPortfolio,
      refreshLivePrices,
      loading,
      error,
    ]
  );

  const settingsValue = useMemo(
    () => ({ settings, updateSettings, loading, error }),
    [settings, updateSettings, loading, error]
  );

  return (
    <SettingsContext.Provider value={settingsValue as unknown as FinanceContextState}>
      <LedgerContext.Provider value={ledgerValue as unknown as FinanceContextState}>
        <PortfolioContext.Provider value={portfolioValue as unknown as FinanceContextState}>
          <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
        </PortfolioContext.Provider>
      </LedgerContext.Provider>
    </SettingsContext.Provider>
  );
};
