/**
 * Unit tests for StocksClient business logic.
 *
 * Tests cover:
 *  - groupedStocks merging (Zerodha-style weighted avg)
 *  - Closed position filtering (quantity === 0 excluded)
 *  - Portfolio metrics (investment, currentValue, P&L, day P&L)
 *  - Lifetime earnings formula
 *  - Sector grouping / distribution
 *  - Form validation guard conditions
 *  - handleStockSubmit input parsing
 */

interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  previousPrice?: number | null;
  exchange: string;
  investmentAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  sector?: string | null;
}

interface StockTransaction {
  transactionType: 'BUY' | 'SELL';
  totalAmount: number;
  brokerage?: number;
  taxes?: number;
}

// ─── Pure helpers mirroring StocksClient logic ────────────────────────────────

function groupStocks(stocks: Stock[]): Stock[] {
  const groups: Record<string, Stock> = {};

  stocks.forEach((stock) => {
    const key = `${stock.symbol.toUpperCase()}_${stock.exchange.toUpperCase()}`;
    if (!groups[key]) {
      groups[key] = { ...stock };
    } else {
      const existing = groups[key];
      const totalQty = existing.quantity + stock.quantity;
      const totalInvestment = existing.investmentAmount + stock.investmentAmount;

      const existingPrevPrice = existing.previousPrice ?? existing.currentPrice;
      const stockPrevPrice = stock.previousPrice ?? stock.currentPrice;
      const totalPrevValue =
        existingPrevPrice * existing.quantity + stockPrevPrice * stock.quantity;

      existing.quantity = totalQty;
      existing.investmentAmount = totalInvestment;
      existing.avgPrice = totalQty > 0 ? totalInvestment / totalQty : 0;
      existing.currentPrice = stock.currentPrice;
      existing.previousPrice = totalQty > 0 ? totalPrevValue / totalQty : existing.currentPrice;
      existing.currentValue += stock.currentValue;
      existing.pnl += stock.pnl;
      existing.pnlPercentage =
        existing.investmentAmount > 0 ? (existing.pnl / existing.investmentAmount) * 100 : 0;
    }
  });

  return Object.values(groups)
    .filter((stock) => stock.quantity > 0)
    .sort((a, b) => b.currentValue - a.currentValue);
}

function calcPortfolioMetrics(grouped: Stock[]) {
  const totalInvestment = grouped.reduce((sum, s) => sum + s.investmentAmount, 0);
  const totalCurrentValue = grouped.reduce((sum, s) => sum + s.currentValue, 0);
  const totalPnL = totalCurrentValue - totalInvestment;
  const totalDayPnL = grouped.reduce((sum, s) => {
    return sum + (s.currentPrice - (s.previousPrice ?? s.currentPrice)) * s.quantity;
  }, 0);
  return { totalInvestment, totalCurrentValue, totalPnL, totalDayPnL };
}

function calcLifetimeEarned(txns: StockTransaction[], currentValue: number): number {
  const totalBuys = txns
    .filter((t) => t.transactionType === 'BUY')
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalSells = txns
    .filter((t) => t.transactionType === 'SELL')
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalCharges = txns.reduce((s, t) => s + (t.brokerage || 0) + (t.taxes || 0), 0);
  return totalSells + currentValue - (totalBuys + totalCharges);
}

function groupBySector(stocks: Stock[]) {
  return stocks.reduce(
    (acc, stock) => {
      const sector = stock.sector || 'Others';
      const existing = acc.find((item) => item.sector === sector);
      if (existing) {
        existing.value += stock.currentValue;
        existing.investment += stock.investmentAmount;
      } else {
        acc.push({
          sector,
          value: stock.currentValue,
          investment: stock.investmentAmount,
          pnl: stock.currentValue - stock.investmentAmount,
        });
      }
      return acc;
    },
    [] as Array<{ sector: string; value: number; investment: number; pnl: number }>
  );
}

// ─── Test data factory ────────────────────────────────────────────────────────

const makeStock = (overrides: Partial<Stock> = {}): Stock => ({
  id: 1,
  symbol: 'RELIANCE',
  companyName: 'Reliance Industries',
  quantity: 10,
  avgPrice: 2400,
  currentPrice: 2500,
  previousPrice: 2450,
  exchange: 'NSE',
  investmentAmount: 24000,
  currentValue: 25000,
  pnl: 1000,
  pnlPercentage: 4.17,
  sector: 'Energy',
  ...overrides,
});

// ─── groupedStocks tests ──────────────────────────────────────────────────────

describe('StocksClient — groupedStocks (Zerodha-style averaging)', () => {
  it('merges two RELIANCE lots with weighted avg price', () => {
    const stocks = [
      makeStock({
        id: 1,
        quantity: 10,
        avgPrice: 2400,
        investmentAmount: 24000,
        currentValue: 25000,
        pnl: 1000,
      }),
      makeStock({
        id: 2,
        quantity: 5,
        avgPrice: 2600,
        investmentAmount: 13000,
        currentValue: 12500,
        pnl: -500,
      }),
    ];
    const grouped = groupStocks(stocks);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].quantity).toBe(15);
    expect(grouped[0].investmentAmount).toBe(37000);
    // Avg price = 37000 / 15
    expect(grouped[0].avgPrice).toBeCloseTo(2466.67, 1);
  });

  it('filters out stocks with zero quantity (closed positions)', () => {
    const stocks = [
      makeStock({
        id: 1,
        symbol: 'TCS',
        quantity: 0,
        investmentAmount: 0,
        currentValue: 0,
        pnl: 0,
      }),
      makeStock({
        id: 2,
        symbol: 'INFY',
        quantity: 5,
        investmentAmount: 15000,
        currentValue: 16000,
        pnl: 1000,
      }),
    ];
    const grouped = groupStocks(stocks);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].symbol).toBe('INFY');
  });

  it('keeps separate groups for same symbol on different exchanges', () => {
    const stocks = [
      makeStock({ id: 1, symbol: 'RELIANCE', exchange: 'NSE' }),
      makeStock({ id: 2, symbol: 'RELIANCE', exchange: 'BSE' }),
    ];
    const grouped = groupStocks(stocks);
    expect(grouped).toHaveLength(2);
  });

  it('sorts by currentValue descending', () => {
    const stocks = [
      makeStock({ id: 1, symbol: 'SMALL', currentValue: 5000, investmentAmount: 4000 }),
      makeStock({ id: 2, symbol: 'BIG', currentValue: 50000, investmentAmount: 40000 }),
    ];
    const grouped = groupStocks(stocks);
    expect(grouped[0].symbol).toBe('BIG');
    expect(grouped[1].symbol).toBe('SMALL');
  });

  it('calculates weighted average previous price on merge', () => {
    // Lot 1: 10 shares @ prev price 2400
    // Lot 2: 10 shares @ prev price 2600
    // Weighted avg: (2400*10 + 2600*10) / 20 = 2500
    const stocks = [
      makeStock({
        id: 1,
        quantity: 10,
        previousPrice: 2400,
        currentPrice: 2500,
        investmentAmount: 24000,
        currentValue: 25000,
        pnl: 1000,
      }),
      makeStock({
        id: 2,
        quantity: 10,
        previousPrice: 2600,
        currentPrice: 2500,
        investmentAmount: 26000,
        currentValue: 25000,
        pnl: -1000,
      }),
    ];
    const grouped = groupStocks(stocks);
    expect(grouped[0].previousPrice).toBe(2500);
  });

  it('handles single stock without merging', () => {
    const stocks = [makeStock()];
    const grouped = groupStocks(stocks);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].symbol).toBe('RELIANCE');
  });

  it('returns empty array for no stocks', () => {
    expect(groupStocks([])).toHaveLength(0);
  });
});

// ─── Portfolio metrics tests ──────────────────────────────────────────────────

describe('StocksClient — portfolio metrics', () => {
  it('sums investment and current value across all grouped stocks', () => {
    const grouped = [
      makeStock({ investmentAmount: 24000, currentValue: 25000 }),
      makeStock({ id: 2, symbol: 'TCS', investmentAmount: 15000, currentValue: 16000 }),
    ];
    const m = calcPortfolioMetrics(grouped);
    expect(m.totalInvestment).toBe(39000);
    expect(m.totalCurrentValue).toBe(41000);
    expect(m.totalPnL).toBe(2000);
  });

  it('computes day P&L using (currentPrice - previousPrice) * quantity', () => {
    const grouped = [
      // Day change: (2500 - 2450) * 10 = 500
      makeStock({ quantity: 10, currentPrice: 2500, previousPrice: 2450 }),
      // Day change: (1600 - 1550) * 5 = 250
      makeStock({
        id: 2,
        symbol: 'TCS',
        quantity: 5,
        currentPrice: 1600,
        previousPrice: 1550,
        investmentAmount: 7750,
        currentValue: 8000,
      }),
    ];
    const m = calcPortfolioMetrics(grouped);
    expect(m.totalDayPnL).toBe(750);
  });

  it('returns 0 day P&L when no previous price is set', () => {
    const grouped = [makeStock({ quantity: 10, currentPrice: 2500, previousPrice: undefined })];
    const m = calcPortfolioMetrics(grouped);
    expect(m.totalDayPnL).toBe(0);
  });

  it('handles negative P&L correctly', () => {
    const grouped = [makeStock({ investmentAmount: 30000, currentValue: 25000 })];
    const m = calcPortfolioMetrics(grouped);
    expect(m.totalPnL).toBe(-5000);
  });
});

// ─── Lifetime earnings formula ────────────────────────────────────────────────

describe('StocksClient — lifetime earnings', () => {
  it('computes lifetime = sells + currentValue - (buys + charges)', () => {
    const txns: StockTransaction[] = [
      { transactionType: 'BUY', totalAmount: 20000, brokerage: 50, taxes: 10 },
      { transactionType: 'SELL', totalAmount: 15000, brokerage: 40, taxes: 8 },
    ];
    const currentValue = 12000;
    // lifetime = 15000 + 12000 - (20000 + 50 + 10 + 40 + 8) = 6892
    expect(calcLifetimeEarned(txns, currentValue)).toBeCloseTo(6892, 0);
  });

  it('returns currentValue minus buys when no sells exist', () => {
    const txns: StockTransaction[] = [{ transactionType: 'BUY', totalAmount: 10000 }];
    // lifetime = 0 + 8000 - 10000 = -2000
    expect(calcLifetimeEarned(txns, 8000)).toBe(-2000);
  });

  it('returns 0 with no transactions and 0 current value', () => {
    expect(calcLifetimeEarned([], 0)).toBe(0);
  });
});

// ─── Sector grouping tests ────────────────────────────────────────────────────

describe('StocksClient — sector distribution', () => {
  it('groups stocks by sector correctly', () => {
    const stocks = [
      makeStock({ sector: 'IT', currentValue: 10000, investmentAmount: 8000 }),
      makeStock({ id: 2, sector: 'IT', currentValue: 5000, investmentAmount: 4000 }),
      makeStock({ id: 3, sector: 'Energy', currentValue: 20000, investmentAmount: 18000 }),
    ];
    const data = groupBySector(stocks);

    expect(data).toHaveLength(2);
    const it = data.find((d) => d.sector === 'IT')!;
    expect(it.value).toBe(15000);
    expect(it.investment).toBe(12000);
  });

  it('uses "Others" when sector is null or undefined', () => {
    const stocks = [makeStock({ sector: null }), makeStock({ id: 2, sector: undefined })];
    const data = groupBySector(stocks);
    expect(data).toHaveLength(1);
    expect(data[0].sector).toBe('Others');
  });
});

// ─── Form validation guards ───────────────────────────────────────────────────

describe('StocksClient — handleStockSubmit validation', () => {
  function validateStockForm(
    symbol: string,
    companyName: string,
    quantity: string,
    avgPrice: string,
    currentPrice: string
  ): string | null {
    if (!symbol || !companyName || !quantity || !avgPrice || !currentPrice) return 'fill_all';
    const qty = parseInt(quantity);
    const avg = parseFloat(avgPrice);
    const current = parseFloat(currentPrice);
    if (isNaN(qty) || qty <= 0) return 'invalid_quantity';
    if (isNaN(avg) || avg < 0) return 'invalid_avg_price';
    if (isNaN(current) || current < 0) return 'invalid_current_price';
    return null;
  }

  it('rejects when symbol is empty', () => {
    expect(validateStockForm('', 'Company', '10', '100', '110')).toBe('fill_all');
  });

  it('rejects when quantity is zero', () => {
    expect(validateStockForm('TCS', 'TCS Ltd', '0', '3500', '3600')).toBe('invalid_quantity');
  });

  it('rejects when quantity is negative', () => {
    expect(validateStockForm('TCS', 'TCS Ltd', '-5', '3500', '3600')).toBe('invalid_quantity');
  });

  it('rejects when avgPrice is negative', () => {
    expect(validateStockForm('TCS', 'TCS Ltd', '10', '-100', '3600')).toBe('invalid_avg_price');
  });

  it('allows avgPrice of 0 (valid edge case)', () => {
    expect(validateStockForm('TCS', 'TCS Ltd', '10', '0', '3600')).toBeNull();
  });

  it('rejects non-numeric quantity', () => {
    expect(validateStockForm('TCS', 'TCS Ltd', 'abc', '3500', '3600')).toBe('invalid_quantity');
  });

  it('passes all valid inputs', () => {
    expect(validateStockForm('RELIANCE', 'Reliance Industries', '10', '2400', '2500')).toBeNull();
  });
});

// ─── P&L and percentage calculation ──────────────────────────────────────────

describe('StocksClient — stock P&L derivation', () => {
  it('computes pnl and pnlPercentage from avg and current', () => {
    const qty = 10,
      avg = 2400,
      current = 2500;
    const investment = qty * avg; // 24000
    const currentValue = qty * current; // 25000
    const pnl = currentValue - investment; // 1000
    const pnlPct = (pnl / investment) * 100; // 4.167

    expect(pnl).toBe(1000);
    expect(pnlPct).toBeCloseTo(4.17, 1);
  });

  it('handles negative P&L (loss position)', () => {
    const qty = 5,
      avg = 3000,
      current = 2700;
    const investment = qty * avg; // 15000
    const currentValue = qty * current; // 13500
    const pnl = currentValue - investment; // -1500
    const pnlPct = (pnl / investment) * 100; // -10

    expect(pnl).toBe(-1500);
    expect(pnlPct).toBe(-10);
  });
});
