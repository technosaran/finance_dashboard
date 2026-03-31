import { roundTo } from './number';

export interface PositionMetrics {
  investmentAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
}

const normalizeQuantity = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

const normalizeNonNegative = (value: number, fallback: number = 0): number =>
  Number.isFinite(value) && value >= 0 ? value : fallback;

export function calculatePositionMetrics(
  quantity: number,
  averageCost: number,
  currentPrice: number
): PositionMetrics {
  const safeQuantity = normalizeQuantity(quantity);
  const safeAverageCost = normalizeNonNegative(averageCost);
  const safeCurrentPrice = normalizeNonNegative(currentPrice, safeAverageCost);

  return calculatePositionMetricsFromInvestment(
    safeQuantity,
    safeQuantity * safeAverageCost,
    safeCurrentPrice
  );
}

export function calculatePositionMetricsFromInvestment(
  quantity: number,
  investmentAmount: number,
  currentPrice: number
): PositionMetrics {
  const safeQuantity = normalizeQuantity(quantity);
  const safeInvestmentAmount = normalizeNonNegative(investmentAmount);
  const safeCurrentPrice = normalizeNonNegative(currentPrice);
  const currentValue = safeQuantity * safeCurrentPrice;
  const pnl = currentValue - safeInvestmentAmount;

  return {
    investmentAmount: roundTo(safeInvestmentAmount),
    currentValue: roundTo(currentValue),
    pnl: roundTo(pnl),
    pnlPercentage: safeInvestmentAmount > 0 ? roundTo((pnl / safeInvestmentAmount) * 100, 4) : 0,
  };
}

export interface LifetimePerformance {
  costBasis: number;
  lifetimeEarned: number;
  lifetimeReturnPercentage: number;
}

export function calculateLifetimePerformance(
  totalBuys: number,
  totalSells: number,
  currentValue: number,
  totalCharges: number = 0
): LifetimePerformance {
  const safeTotalBuys = normalizeNonNegative(totalBuys);
  const safeTotalSells = normalizeNonNegative(totalSells);
  const safeCurrentValue = normalizeNonNegative(currentValue);
  const safeTotalCharges = normalizeNonNegative(totalCharges);
  const costBasis = safeTotalBuys + safeTotalCharges;
  const lifetimeEarned = safeTotalSells + safeCurrentValue - costBasis;

  return {
    costBasis: roundTo(costBasis),
    lifetimeEarned: roundTo(lifetimeEarned),
    lifetimeReturnPercentage: costBasis > 0 ? roundTo((lifetimeEarned / costBasis) * 100, 4) : 0,
  };
}

export function calculateWeightedAverageYield<
  T extends {
    currentValue?: number;
    investmentAmount?: number;
    yieldToMaturity?: number;
    couponRate?: number;
  },
>(entries: T[]): number {
  const weighted = entries.reduce(
    (acc, entry) => {
      const yieldValue = entry.yieldToMaturity ?? entry.couponRate ?? 0;
      const weight = Math.max(entry.currentValue ?? 0, entry.investmentAmount ?? 0, 0);

      if (!Number.isFinite(yieldValue) || yieldValue <= 0 || weight <= 0) {
        return acc;
      }

      acc.weightedYield += yieldValue * weight;
      acc.totalWeight += weight;
      return acc;
    },
    { weightedYield: 0, totalWeight: 0 }
  );

  return weighted.totalWeight > 0 ? roundTo(weighted.weightedYield / weighted.totalWeight, 4) : 0;
}
