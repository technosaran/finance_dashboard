import {
  calculateLifetimePerformance,
  calculatePositionMetrics,
  calculatePositionMetricsFromInvestment,
  calculateWeightedAverageYield,
} from '@/lib/utils/portfolio';

describe('portfolio utils', () => {
  it('keeps pnl percentage finite when the investment amount is zero', () => {
    expect(calculatePositionMetrics(10, 0, 50)).toEqual({
      investmentAmount: 0,
      currentValue: 500,
      pnl: 500,
      pnlPercentage: 0,
    });
  });

  it('recomputes grouped holdings from total investment and current price', () => {
    expect(calculatePositionMetricsFromInvestment(15, 37000, 2500)).toEqual({
      investmentAmount: 37000,
      currentValue: 37500,
      pnl: 500,
      pnlPercentage: 1.3514,
    });
  });

  it('uses full cost basis including charges for lifetime performance', () => {
    expect(calculateLifetimePerformance(20000, 15000, 12000, 108)).toEqual({
      costBasis: 20108,
      lifetimeEarned: 6892,
      lifetimeReturnPercentage: 34.2749,
    });
  });

  it('calculates weighted average yield by exposure instead of simple count', () => {
    const weightedYield = calculateWeightedAverageYield([
      { currentValue: 100000, yieldToMaturity: 8 },
      { currentValue: 10000, yieldToMaturity: 12 },
    ]);

    expect(weightedYield).toBe(8.3636);
  });
});
