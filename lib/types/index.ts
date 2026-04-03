/**
 * Comprehensive type definitions for the financial dashboard
 * Replaces all 'any' types with proper TypeScript types
 */

// ============================================================================
// Account Types
// ============================================================================

export type Currency = 'USD' | 'INR';
export type AccountType =
  | 'Savings'
  | 'Checking'
  | 'Current'
  | 'Wallet'
  | 'Investment'
  | 'Credit Card'
  | 'Cash'
  | 'Other';

export interface Account {
  id: number;
  name: string;
  bankName: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionType = 'Income' | 'Expense';
export type TransactionCategory =
  | 'Salary'
  | 'Business'
  | 'Investment'
  | 'Rent'
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Shopping'
  | 'Utilities'
  | 'Other';

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: TransactionCategory | string;
  type: TransactionType;
  amount: number;
  accountId?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Goal Types
// ============================================================================

export type GoalCategory =
  | 'Retirement'
  | 'Home'
  | 'Education'
  | 'Vacation'
  | 'Emergency Fund'
  | 'Investment'
  | 'Other';

export interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: GoalCategory | string;
  description?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Family Transfer Types
// ============================================================================

export type RelationshipType =
  | 'Parent'
  | 'Spouse'
  | 'Child'
  | 'Sibling'
  | 'Relative'
  | 'Friend'
  | 'Other';

export interface FamilyTransfer {
  id: number;
  recipient: string;
  relationship: RelationshipType | string;
  amount: number;
  date: string;
  purpose?: string;
  notes?: string;
  accountId?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Stock Types
// ============================================================================

export type StockTransactionType = 'BUY' | 'SELL';
export type StockExchange = 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' | 'OTHER';

export interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  sector?: string;
  exchange: StockExchange | string;
  investmentAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  previousPrice?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockTransaction {
  id: number;
  stockId: number;
  transactionType: StockTransactionType;
  quantity: number;
  price: number;
  totalAmount: number;
  brokerage?: number;
  taxes?: number;
  transactionDate: string;
  notes?: string;
  accountId?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Mutual Fund Types
// ============================================================================

export type MutualFundTransactionType = 'BUY' | 'SELL' | 'SIP';
export type MutualFundCategory =
  | 'Equity'
  | 'Debt'
  | 'Hybrid'
  | 'Index'
  | 'ELSS'
  | 'Liquid'
  | 'Other';

export interface MutualFund {
  id: number;
  schemeName: string;
  schemeCode: string;
  units: number;
  avgNav: number;
  currentNav: number;
  category?: MutualFundCategory | string;
  investmentAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  isin?: string;
  folioNumber?: string;
  previousNav?: number;
}

export interface MutualFundTransaction {
  id: number;
  mutualFundId: number;
  transactionType: MutualFundTransactionType;
  units: number;
  nav: number;
  totalAmount: number;
  transactionDate: string;
  notes?: string;
  accountId?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Bond Types
// ============================================================================

export interface Bond {
  id: number;
  name: string;
  companyName?: string;
  isin?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  couponRate?: number;
  maturityDate?: string;
  status: 'ACTIVE' | 'MATURED' | 'SOLD' | string;
  investmentAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  yieldToMaturity?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BondTransaction {
  id: number;
  bondId: number;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  transactionDate: string;
  notes?: string;
  accountId?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// F&O Types
// ============================================================================

export type FnoType = 'FUTURE' | 'CALL' | 'PUT';
export type FnoStatus = 'OPEN' | 'CLOSED';
export type FnoAction = 'BUY' | 'SELL';
export type FnoProduct = 'NRML' | 'MIS';

export interface FnoTrade {
  id: number;
  instrument: string;
  tradeType: FnoAction;
  product: FnoProduct;
  quantity: number;
  avgPrice: number;
  exitPrice?: number;
  entryDate: string;
  exitDate?: string;
  status: FnoStatus;
  pnl: number;
  notes?: string;
  accountId?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Settings Types
// ============================================================================

export type BrokerageType = 'flat' | 'percentage';

export interface AppSettings {
  displayName?: string;
  brokerageType: BrokerageType;
  brokerageValue: number;
  sttRate: number;
  transactionChargeRate: number;
  sebiChargeRate: number;
  stampDutyRate: number;
  gstRate: number;
  dpCharges: number;
  autoCalculateCharges: boolean;
  defaultStockAccountId?: number;
  defaultMfAccountId?: number;
  defaultSalaryAccountId?: number;
  // Sidebar visibility toggles (all default to true)
  stocksVisible?: boolean;
  mutualFundsVisible?: boolean;
  fnoVisible?: boolean;
  ledgerVisible?: boolean;
  incomeVisible?: boolean;
  expensesVisible?: boolean;
  goalsVisible?: boolean;
  familyVisible?: boolean;
  bondsVisible?: boolean;
  forexVisible?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// Form State Types
// ============================================================================

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// Context Types
// ============================================================================

export interface FinanceContextState {
  // Accounts
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: number, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  addFunds: (
    accountId: number,
    amount: number,
    description?: string,
    category?: string
  ) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: number, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;

  // Stocks
  stocks: Stock[];
  addStock: (stock: Omit<Stock, 'id'>) => Promise<Stock>;
  updateStock: (id: number, stock: Partial<Stock>) => Promise<void>;
  deleteStock: (id: number) => Promise<void>;
  stockTransactions: StockTransaction[];
  addStockTransaction: (tx: Omit<StockTransaction, 'id'>) => Promise<void>;
  deleteStockTransaction: (id: number) => Promise<void>;

  // Mutual Funds
  mutualFunds: MutualFund[];
  addMutualFund: (mf: Omit<MutualFund, 'id'>) => Promise<MutualFund>;
  updateMutualFund: (id: number, mf: Partial<MutualFund>) => Promise<void>;
  deleteMutualFund: (id: number) => Promise<void>;
  mutualFundTransactions: MutualFundTransaction[];
  addMutualFundTransaction: (tx: Omit<MutualFundTransaction, 'id'>) => Promise<void>;
  deleteMutualFundTransaction: (id: number) => Promise<void>;

  // F&O
  fnoTrades: FnoTrade[];
  addFnoTrade: (trade: Omit<FnoTrade, 'id'>) => Promise<void>;
  updateFnoTrade: (id: number, trade: Partial<FnoTrade>) => Promise<void>;
  deleteFnoTrade: (id: number) => Promise<void>;

  // Bonds
  bonds: Bond[];
  addBond: (bond: Omit<Bond, 'id'>) => Promise<Bond>;
  updateBond: (id: number, bond: Partial<Bond>) => Promise<void>;
  deleteBond: (id: number) => Promise<void>;
  bondTransactions: BondTransaction[];
  addBondTransaction: (tx: Omit<BondTransaction, 'id'>) => Promise<void>;
  deleteBondTransaction: (id: number) => Promise<void>;

  // Family Transfers
  familyTransfers: FamilyTransfer[];
  addFamilyTransfer: (transfer: Omit<FamilyTransfer, 'id'>) => Promise<void>;
  updateFamilyTransfer: (id: number, transfer: Partial<FamilyTransfer>) => Promise<void>;
  deleteFamilyTransfer: (id: number) => Promise<void>;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Refresh
  refreshPortfolio: (silent?: boolean) => Promise<void>;
  refreshLivePrices: (silent?: boolean) => Promise<void>;

  // Combined Modal State
  isTransactionModalOpen: boolean;
  setIsTransactionModalOpen: (open: boolean) => void;

  // Loading state
  loading: boolean;
  error: string | null;
}

export interface AuthContextState {
  user: { id: string; email?: string } | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
