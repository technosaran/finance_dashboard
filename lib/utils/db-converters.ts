import {
  Account,
  AccountType,
  Transaction,
  Goal,
  FamilyTransfer,
  Stock,
  StockTransaction,
  Watchlist,
  MutualFund,
  MutualFundTransaction,
  FnoTrade,
  Bond,
  BondTransaction,
  BondTransactionType,
  ForexTransaction,
  ForexTransactionType,
  AppSettings,
} from '../types';

// Database row types
export type AccountRow = {
  id: number;
  name: string;
  bank_name: string;
  type: string;
  balance: number;
  currency: string;
  [key: string]: unknown;
};
export type TransactionRow = {
  id: number;
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
  account_id?: number | null;
  [key: string]: unknown;
};
export type GoalRow = {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  description?: string | null;
  [key: string]: unknown;
};
export type FamilyTransferRow = {
  id: number;
  date: string;
  recipient: string;
  relationship: string;
  amount: number;
  purpose: string;
  notes?: string | null;
  account_id?: number | null;
  [key: string]: unknown;
};
export type StockRow = {
  id: number;
  symbol: string;
  company_name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  sector?: string | null;
  exchange: string;
  investment_amount: number;
  current_value: number;
  pnl: number;
  pnl_percentage: number;
  previous_price?: number | null;
  [key: string]: unknown;
};
export type StockTransactionRow = {
  id: number;
  stock_id?: number | null;
  transaction_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  brokerage?: number | null;
  taxes?: number | null;
  transaction_date: string;
  notes?: string | null;
  account_id?: number | null;
  [key: string]: unknown;
};
export type WatchlistRow = {
  id: number;
  symbol: string;
  company_name: string;
  target_price?: number | null;
  current_price?: number | null;
  notes?: string | null;
  [key: string]: unknown;
};
export type MutualFundRow = {
  id: number;
  name: string;
  isin?: string | null;
  scheme_code?: string | null;
  category?: string | null;
  units: number;
  avg_nav: number;
  current_nav: number;
  investment_amount: number;
  current_value: number;
  pnl: number;
  pnl_percentage: number;
  folio_number?: string | null;
  previous_nav?: number | null;
  [key: string]: unknown;
};
export type MutualFundTransactionRow = {
  id: number;
  mutual_fund_id?: number | null;
  transaction_type: string;
  units: number;
  nav: number;
  total_amount: number;
  transaction_date: string;
  notes?: string | null;
  account_id?: number | null;
  [key: string]: unknown;
};
export type FnoTradeRow = {
  id: number;
  instrument: string;
  trade_type: string;
  product: string;
  quantity: number;
  avg_price: number;
  exit_price?: number | null;
  entry_date: string;
  exit_date?: string | null;
  status: string;
  pnl?: number | null;
  notes?: string | null;
  account_id?: number | null;
  [key: string]: unknown;
};
export type BondRow = {
  id: number;
  name: string;
  company_name?: string | null;
  isin?: string | null;
  face_value?: number | null;
  coupon_rate?: number | null;
  maturity_date?: string | null;
  quantity?: number | null;
  avg_price?: number | null;
  current_price?: number | null;
  investment_amount?: number | null;
  current_value?: number | null;
  pnl?: number | null;
  pnl_percentage?: number | null;
  yield_to_maturity?: number | null;
  interest_frequency?: string | null;
  next_interest_date?: string | null;
  status?: string | null;
  previous_price?: number | null;
  [key: string]: unknown;
};
export type BondTransactionRow = {
  id: number;
  bond_id?: number | null;
  transaction_type: string;
  quantity?: number | null;
  price?: number | null;
  total_amount: number;
  transaction_date?: string | null;
  notes?: string | null;
  account_id?: number | null;
  [key: string]: unknown;
};
export type ForexTransactionRow = {
  id: number;
  transaction_type: string;
  amount: number;
  date?: string | null;
  transaction_date?: string | null;
  notes?: string | null;
  account_id?: number | null;
  [key: string]: unknown;
};
export type AppSettingsRow = {
  user_id: string;
  brokerage_type: string;
  brokerage_value: number;
  stt_rate: number;
  transaction_charge_rate: number;
  sebi_charge_rate: number;
  stamp_duty_rate: number;
  gst_rate: number;
  dp_charges: number;
  auto_calculate_charges: boolean;
  bonds_enabled: boolean;
  forex_enabled: boolean;
  default_stock_account_id?: number | null;
  default_mf_account_id?: number | null;
  default_salary_account_id?: number | null;
  stocks_visible?: boolean | null;
  mutual_funds_visible?: boolean | null;
  fno_visible?: boolean | null;
  ledger_visible?: boolean | null;
  income_visible?: boolean | null;
  expenses_visible?: boolean | null;
  goals_visible?: boolean | null;
  family_visible?: boolean | null;
  [key: string]: unknown;
};

export const dbSettingsToSettings = (dbSettings: AppSettingsRow): AppSettings => ({
  brokerageType: dbSettings.brokerage_type as 'flat' | 'percentage',
  brokerageValue: Number(dbSettings.brokerage_value),
  sttRate: Number(dbSettings.stt_rate),
  transactionChargeRate: Number(dbSettings.transaction_charge_rate),
  sebiChargeRate: Number(dbSettings.sebi_charge_rate),
  stampDutyRate: Number(dbSettings.stamp_duty_rate),
  gstRate: Number(dbSettings.gst_rate),
  dpCharges: Number(dbSettings.dp_charges),
  autoCalculateCharges: dbSettings.auto_calculate_charges,
  bondsEnabled: dbSettings.bonds_enabled ?? true,
  forexEnabled: dbSettings.forex_enabled ?? true,
  defaultStockAccountId: dbSettings.default_stock_account_id
    ? Number(dbSettings.default_stock_account_id)
    : undefined,
  defaultMfAccountId: dbSettings.default_mf_account_id
    ? Number(dbSettings.default_mf_account_id)
    : undefined,
  defaultSalaryAccountId: dbSettings.default_salary_account_id
    ? Number(dbSettings.default_salary_account_id)
    : undefined,
  stocksVisible: dbSettings.stocks_visible ?? true,
  mutualFundsVisible: dbSettings.mutual_funds_visible ?? true,
  fnoVisible: dbSettings.fno_visible ?? true,
  ledgerVisible: dbSettings.ledger_visible ?? true,
  incomeVisible: dbSettings.income_visible ?? true,
  expensesVisible: dbSettings.expenses_visible ?? true,
  goalsVisible: dbSettings.goals_visible ?? true,
  familyVisible: dbSettings.family_visible ?? true,
});

export const dbAccountToAccount = (dbAccount: AccountRow): Account => ({
  id: Number(dbAccount.id),
  name: dbAccount.name,
  bankName: dbAccount.bank_name,
  type: dbAccount.type as AccountType,
  balance: Number(dbAccount.balance),
  currency: dbAccount.currency as 'USD' | 'INR',
});

export const dbTransactionToTransaction = (dbTransaction: TransactionRow): Transaction => ({
  id: Number(dbTransaction.id),
  date: dbTransaction.date,
  description: dbTransaction.description,
  category: dbTransaction.category,
  type: dbTransaction.type as 'Income' | 'Expense',
  amount: Number(dbTransaction.amount),
  accountId: dbTransaction.account_id ? Number(dbTransaction.account_id) : undefined,
});

export const dbGoalToGoal = (dbGoal: GoalRow): Goal => ({
  id: Number(dbGoal.id),
  name: dbGoal.name,
  targetAmount: Number(dbGoal.target_amount),
  currentAmount: Number(dbGoal.current_amount),
  deadline: dbGoal.deadline,
  category: dbGoal.category,
  description: dbGoal.description || undefined,
});

export const dbFamilyTransferToFamilyTransfer = (
  dbTransfer: FamilyTransferRow
): FamilyTransfer => ({
  id: Number(dbTransfer.id),
  date: dbTransfer.date,
  recipient: dbTransfer.recipient,
  relationship: dbTransfer.relationship,
  amount: Number(dbTransfer.amount),
  purpose: dbTransfer.purpose,
  notes: dbTransfer.notes || undefined,
  accountId: dbTransfer.account_id ? Number(dbTransfer.account_id) : undefined,
});

export const dbStockToStock = (dbStock: StockRow): Stock => ({
  id: Number(dbStock.id),
  symbol: dbStock.symbol,
  companyName: dbStock.company_name,
  quantity: Number(dbStock.quantity),
  avgPrice: Number(dbStock.avg_price),
  currentPrice: Number(dbStock.current_price),
  sector: dbStock.sector || undefined,
  exchange: dbStock.exchange,
  investmentAmount: Number(dbStock.investment_amount),
  currentValue: Number(dbStock.current_value),
  pnl: Number(dbStock.pnl),
  pnlPercentage: Number(dbStock.pnl_percentage),
  previousPrice: dbStock.previous_price ? Number(dbStock.previous_price) : undefined,
});

export const dbStockTransactionToStockTransaction = (
  dbTransaction: StockTransactionRow
): StockTransaction => ({
  id: Number(dbTransaction.id),
  stockId: Number(dbTransaction.stock_id),
  transactionType: dbTransaction.transaction_type as 'BUY' | 'SELL',
  quantity: Number(dbTransaction.quantity),
  price: Number(dbTransaction.price),
  totalAmount: Number(dbTransaction.total_amount),
  brokerage: dbTransaction.brokerage ? Number(dbTransaction.brokerage) : undefined,
  taxes: dbTransaction.taxes ? Number(dbTransaction.taxes) : undefined,
  transactionDate: dbTransaction.transaction_date,
  notes: dbTransaction.notes || undefined,
  accountId: dbTransaction.account_id ? Number(dbTransaction.account_id) : undefined,
});

export const dbWatchlistToWatchlistItem = (dbWatchlist: WatchlistRow): Watchlist => ({
  id: Number(dbWatchlist.id),
  symbol: dbWatchlist.symbol,
  companyName: dbWatchlist.company_name,
  targetPrice: dbWatchlist.target_price ? Number(dbWatchlist.target_price) : undefined,
  notes: dbWatchlist.notes || undefined,
});

export const dbMutualFundToMutualFund = (dbMF: MutualFundRow): MutualFund => ({
  id: Number(dbMF.id),
  schemeName: dbMF.name,
  schemeCode: dbMF.scheme_code || '',
  category: dbMF.category || '',
  units: Number(dbMF.units),
  avgNav: Number(dbMF.avg_nav),
  currentNav: Number(dbMF.current_nav),
  investmentAmount: Number(dbMF.investment_amount),
  currentValue: Number(dbMF.current_value),
  pnl: Number(dbMF.pnl),
  pnlPercentage: Number(dbMF.pnl_percentage),
  folioNumber: dbMF.folio_number || undefined,
  isin: dbMF.isin || undefined,
  previousNav: dbMF.previous_nav ? Number(dbMF.previous_nav) : undefined,
});

export const dbMutualFundTransactionToMutualFundTransaction = (
  dbTx: MutualFundTransactionRow
): MutualFundTransaction => ({
  id: Number(dbTx.id),
  mutualFundId: Number(dbTx.mutual_fund_id),
  transactionType: dbTx.transaction_type as 'BUY' | 'SELL' | 'SIP',
  units: Number(dbTx.units),
  nav: Number(dbTx.nav),
  totalAmount: Number(dbTx.total_amount),
  transactionDate: dbTx.transaction_date,
  notes: dbTx.notes || undefined,
  accountId: dbTx.account_id ? Number(dbTx.account_id) : undefined,
});

export const dbFnoTradeToFnoTrade = (dbTx: FnoTradeRow): FnoTrade => ({
  id: Number(dbTx.id),
  instrument: dbTx.instrument,
  tradeType: dbTx.trade_type as FnoTrade['tradeType'],
  product: dbTx.product as FnoTrade['product'],
  quantity: Number(dbTx.quantity),
  avgPrice: Number(dbTx.avg_price),
  exitPrice: dbTx.exit_price ? Number(dbTx.exit_price) : undefined,
  entryDate: dbTx.entry_date,
  exitDate: dbTx.exit_date || undefined,
  status: dbTx.status as FnoTrade['status'],
  pnl: dbTx.pnl ? Number(dbTx.pnl) : 0,
  notes: dbTx.notes || undefined,
  accountId: dbTx.account_id ? Number(dbTx.account_id) : undefined,
});

export const dbBondToBond = (dbBond: BondRow): Bond => ({
  id: Number(dbBond.id),
  name: dbBond.name,
  companyName: dbBond.company_name || undefined,
  isin: dbBond.isin || undefined,
  faceValue: dbBond.face_value ? Number(dbBond.face_value) : 1000,
  couponRate: dbBond.coupon_rate ? Number(dbBond.coupon_rate) : 0,
  maturityDate: dbBond.maturity_date || '',
  quantity: dbBond.quantity ? Number(dbBond.quantity) : 0,
  avgPrice: dbBond.avg_price ? Number(dbBond.avg_price) : 0,
  currentPrice: dbBond.current_price ? Number(dbBond.current_price) : 0,
  investmentAmount: dbBond.investment_amount ? Number(dbBond.investment_amount) : 0,
  currentValue: dbBond.current_value ? Number(dbBond.current_value) : 0,
  pnl: dbBond.pnl ? Number(dbBond.pnl) : 0,
  pnlPercentage: dbBond.pnl_percentage ? Number(dbBond.pnl_percentage) : 0,
  yieldToMaturity: dbBond.yield_to_maturity ? Number(dbBond.yield_to_maturity) : undefined,
  interestFrequency: dbBond.interest_frequency || 'Yearly',
  nextInterestDate: dbBond.next_interest_date || undefined,
  status: (dbBond.status as Bond['status']) || 'ACTIVE',
  previousPrice: dbBond.previous_price ? Number(dbBond.previous_price) : undefined,
});

export const dbBondTransactionToBondTransaction = (dbTx: BondTransactionRow): BondTransaction => ({
  id: Number(dbTx.id),
  bondId: Number(dbTx.bond_id),
  transactionType: dbTx.transaction_type as BondTransactionType,
  quantity: dbTx.quantity ? Number(dbTx.quantity) : 0,
  price: dbTx.price ? Number(dbTx.price) : 0,
  totalAmount: Number(dbTx.total_amount),
  transactionDate: dbTx.transaction_date || '',
  notes: dbTx.notes || undefined,
  accountId: dbTx.account_id ? Number(dbTx.account_id) : undefined,
});

export const dbForexTransactionToForexTransaction = (
  dbTx: ForexTransactionRow
): ForexTransaction => ({
  id: Number(dbTx.id),
  transactionType: dbTx.transaction_type as ForexTransactionType,
  amount: Number(dbTx.amount),
  date: dbTx.date || dbTx.transaction_date || '',
  notes: dbTx.notes || undefined,
  accountId: dbTx.account_id ? Number(dbTx.account_id) : undefined,
});
