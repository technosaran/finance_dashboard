import {
  dbMutualFundToMutualFund,
  dbStockToStock,
  dbStockTransactionToStockTransaction,
  MutualFundRow,
  StockRow,
  StockTransactionRow,
} from '@/lib/utils/db-converters';

describe('db converters', () => {
  it('preserves a zero previous close for stocks', () => {
    const row: StockRow = {
      id: 1,
      symbol: 'TEST',
      company_name: 'Test Corp',
      quantity: 10,
      avg_price: 100,
      current_price: 120,
      exchange: 'NSE',
      investment_amount: 1000,
      current_value: 1200,
      pnl: 200,
      pnl_percentage: 20,
      previous_price: 0,
    };

    expect(dbStockToStock(row).previousPrice).toBe(0);
  });

  it('preserves a zero previous nav for mutual funds', () => {
    const row: MutualFundRow = {
      id: 1,
      name: 'Test Fund',
      scheme_code: '12345',
      category: 'Equity',
      units: 10,
      avg_nav: 100,
      current_nav: 120,
      investment_amount: 1000,
      current_value: 1200,
      pnl: 200,
      pnl_percentage: 20,
      previous_nav: 0,
    };

    expect(dbMutualFundToMutualFund(row).previousNav).toBe(0);
  });

  it('preserves explicit zero brokerage and taxes on stock transactions', () => {
    const row: StockTransactionRow = {
      id: 1,
      stock_id: 2,
      transaction_type: 'BUY',
      quantity: 10,
      price: 100,
      total_amount: 1000,
      brokerage: 0,
      taxes: 0,
      transaction_date: '2026-03-31',
    };

    expect(dbStockTransactionToStockTransaction(row)).toEqual(
      expect.objectContaining({
        brokerage: 0,
        taxes: 0,
      })
    );
  });
});
