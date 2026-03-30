import { renderHook, act, waitFor } from '@testing-library/react';
import { useFinance, FinanceProvider } from '../../app/components/FinanceContext';
import { supabase } from '../../lib/config/supabase';
import { useAuth } from '../../app/components/AuthContext';

// Mock dependencies
jest.mock('../../lib/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../app/components/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../lib/utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('useFinance Hook - Data Addition Tests', () => {
  const mockUser = { id: 'test-user-id' };

  // Setup mock implementation for supabase
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth to return a valid user
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    // Mock supabase chain
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockSelect.mockReturnValue({
      order: mockOrder,
      single: mockSingle,
    });

    mockOrder.mockReturnValue({
      limit: mockLimit,
    });

    mockLimit.mockReturnValue({
      data: [],
      error: null,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    // For single()
    mockSingle.mockResolvedValue({
      data: { id: 123 }, // Generic response
      error: null,
    });

    // For plain select() (refresh calls) which returns array
    // Wait, refresh calls await supabase.from().select('*') which returns data directly?
    // supabase-js v2 returns { data, error } directly on await if no single()

    // Actually, select() returns a Thenable (PostgrestFilterBuilder)
    // FinaneContext: await supabase.from('stocks').select('*')

    // Check implementation:
    // await supabase.from('stocks').select('*')
    // We need to make select() return a Promise resolving to { data: [], error: null } if awaited directly?
    // OR allow chaining for other calls.

    // We can make the object returned by select() have a 'then' method?
    // Or simpler: specific mocks for specific tables if needed.

    // Let's refine mockSelect
    // For refresh calls: await supabase.from(...).select(...)
    // For add calls: await supabase.from(...).insert(...).select().single()

    // We need to return an object that acts as a promise AND has methods.

    const mockBuilder = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      limit: mockLimit,
      then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }), // Default for await select('*')
    };

    mockFrom.mockReturnValue(mockBuilder);
    mockSelect.mockReturnValue(mockBuilder);
    mockInsert.mockReturnValue(mockBuilder);
    mockUpdate.mockReturnValue(mockBuilder);
    mockEq.mockReturnValue(mockBuilder);
    mockOrder.mockReturnValue(mockBuilder);
    mockLimit.mockReturnValue(mockBuilder);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FinanceProvider>{children}</FinanceProvider>
  );

  it('should add an account correctly', async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newAccount = {
      name: 'Test Account',
      bankName: 'Test Bank',
      type: 'Savings',
      balance: 1000,
      currency: 'INR',
    };

    await act(async () => {
      await result.current.addAccount(newAccount);
    });

    expect(mockFrom).toHaveBeenCalledWith('accounts');
    expect(mockInsert).toHaveBeenCalledWith({
      name: newAccount.name,
      bank_name: newAccount.bankName,
      type: newAccount.type,
      balance: newAccount.balance,
      currency: newAccount.currency,
    });
  });

  it('should add a stock correctly', async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newStock = {
      symbol: 'TEST',
      companyName: 'Test Corp',
      quantity: 10,
      avgPrice: 100,
      currentPrice: 110,
      exchange: 'NSE',
      investmentAmount: 1000,
      currentValue: 1100,
      pnl: 100,
      pnlPercentage: 10,
    };

    await act(async () => {
      await result.current.addStock(newStock);
    });

    expect(mockFrom).toHaveBeenCalledWith('stocks');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: newStock.symbol,
        company_name: newStock.companyName,
        quantity: newStock.quantity,
        avg_price: newStock.avgPrice,
        current_price: newStock.currentPrice,
        previous_price: newStock.currentPrice,
        exchange: newStock.exchange,
        investment_amount: newStock.investmentAmount,
        current_value: newStock.currentValue,
        pnl: newStock.pnl,
        pnl_percentage: newStock.pnlPercentage,
        sector: undefined,
      })
    );
  });

  it('should add a mutual fund correctly', async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newMF = {
      schemeName: 'Test Fund',
      schemeCode: '12345',
      category: 'Equity',
      units: 50,
      avgNav: 20,
      currentNav: 22,
      investmentAmount: 1000,
      currentValue: 1100,
      pnl: 100,
      pnlPercentage: 10,
      isin: 'INE123',
      folioNumber: 'F123',
    };

    await act(async () => {
      await result.current.addMutualFund(newMF);
    });

    expect(mockFrom).toHaveBeenCalledWith('mutual_funds');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: newMF.schemeName,
        scheme_code: newMF.schemeCode,
        units: newMF.units,
        current_nav: newMF.currentNav,
      })
    );
  });

  it('should add an F&O trade correctly', async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newTrade = {
      instrument: 'NIFTY',
      tradeType: 'BUY',
      product: 'NRML',
      quantity: 50,
      avgPrice: 100,
      status: 'OPEN',
      entryDate: '2023-01-01',
      pnl: 0,
      accountId: 1,
    };

    await act(async () => {
      await result.current.addFnoTrade(newTrade);
    });

    expect(mockFrom).toHaveBeenCalledWith('fno_trades');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        instrument: newTrade.instrument,
        trade_type: newTrade.tradeType,
        quantity: newTrade.quantity,
        status: newTrade.status,
      })
    );
  });

  it('should add a transaction correctly', async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newTx = {
      date: '2023-01-01',
      description: 'Test Tx',
      category: 'Food',
      type: 'Expense',
      transactionType: 'EXPENSE' as const,
      amount: 500,
      accountId: 1,
    };

    await act(async () => {
      await result.current.addTransaction(newTx);
    });

    expect(mockFrom).toHaveBeenCalledWith('transactions');
    expect(mockInsert).toHaveBeenCalledWith({
      date: newTx.date,
      description: newTx.description,
      category: newTx.category,
      type: newTx.type,
      transaction_type: newTx.transactionType,
      metadata: {},
      amount: newTx.amount,
      account_id: newTx.accountId,
    });
  });
});
