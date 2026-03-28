import { BondTransaction, MutualFundTransaction, StockTransaction } from '@/lib/types';
import { calculateBondCharges, calculateMfCharges } from '@/lib/utils/charges';

const DAYS_IN_YEAR = 365;
const MIN_RATE = -0.999999;
const NPV_TOLERANCE = 1e-7;
const RATE_TOLERANCE = 1e-10;
const MAX_NEWTON_ITERATIONS = 50;
const MAX_BISECTION_ITERATIONS = 200;

export interface CashFlow {
  date: Date | string;
  amount: number;
}

export interface NormalizedCashFlow {
  date: Date;
  amount: number;
}

export interface PerformanceInput {
  cashFlows: CashFlow[];
  fees: number;
}

export interface PerformanceSummary {
  cashIn: number;
  cashOut: number;
  endingValue: number;
  fees: number;
  netContributions: number;
  absoluteProfit: number;
  simpleReturnPercentage: number | null;
  moneyWeightedReturn: number | null;
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid cash flow date: ${value}`);
  }

  return parsed;
}

function normalizeCashFlows(cashFlows: CashFlow[]): NormalizedCashFlow[] {
  return cashFlows
    .map((cashFlow) => ({
      date: toDate(cashFlow.date),
      amount: cashFlow.amount,
    }))
    .filter((cashFlow) => Number.isFinite(cashFlow.amount) && cashFlow.amount !== 0)
    .sort((first, second) => first.date.getTime() - second.date.getTime());
}

function hasPositiveAndNegativeFlows(cashFlows: NormalizedCashFlow[]): boolean {
  const hasNegative = cashFlows.some((cashFlow) => cashFlow.amount < 0);
  const hasPositive = cashFlows.some((cashFlow) => cashFlow.amount > 0);
  return hasNegative && hasPositive;
}

function yearFraction(startDate: Date, endDate: Date): number {
  return (endDate.getTime() - startDate.getTime()) / (DAYS_IN_YEAR * 24 * 60 * 60 * 1000);
}

function calculateNpv(rate: number, cashFlows: NormalizedCashFlow[]): number {
  const anchorDate = cashFlows[0]?.date;
  if (!anchorDate) return 0;

  return cashFlows.reduce((total, cashFlow) => {
    const years = yearFraction(anchorDate, cashFlow.date);
    return total + cashFlow.amount / Math.pow(1 + rate, years);
  }, 0);
}

function calculateNpvDerivative(rate: number, cashFlows: NormalizedCashFlow[]): number {
  const anchorDate = cashFlows[0]?.date;
  if (!anchorDate) return 0;

  return cashFlows.reduce((total, cashFlow) => {
    const years = yearFraction(anchorDate, cashFlow.date);
    return total - (years * cashFlow.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

function tryNewtonSolve(cashFlows: NormalizedCashFlow[], initialRate: number): number | null {
  let rate = Math.max(initialRate, MIN_RATE + 1e-6);

  for (let index = 0; index < MAX_NEWTON_ITERATIONS; index += 1) {
    const value = calculateNpv(rate, cashFlows);
    if (Math.abs(value) <= NPV_TOLERANCE) {
      return rate;
    }

    const derivative = calculateNpvDerivative(rate, cashFlows);
    if (!Number.isFinite(derivative) || Math.abs(derivative) <= RATE_TOLERANCE) {
      return null;
    }

    const nextRate = rate - value / derivative;
    if (!Number.isFinite(nextRate) || nextRate <= MIN_RATE) {
      return null;
    }

    if (Math.abs(nextRate - rate) <= RATE_TOLERANCE) {
      return nextRate;
    }

    rate = nextRate;
  }

  return Math.abs(calculateNpv(rate, cashFlows)) <= NPV_TOLERANCE ? rate : null;
}

function tryBisectionSolve(cashFlows: NormalizedCashFlow[]): number | null {
  let lowerRate = MIN_RATE + 1e-6;
  let upperRate = 0.1;
  let lowerValue = calculateNpv(lowerRate, cashFlows);
  let upperValue = calculateNpv(upperRate, cashFlows);

  if (Math.abs(lowerValue) <= NPV_TOLERANCE) return lowerRate;
  if (Math.abs(upperValue) <= NPV_TOLERANCE) return upperRate;

  while (lowerValue * upperValue > 0 && upperRate < 100) {
    upperRate = upperRate < 1 ? upperRate * 2 : upperRate + 1;
    upperValue = calculateNpv(upperRate, cashFlows);
    if (Math.abs(upperValue) <= NPV_TOLERANCE) {
      return upperRate;
    }
  }

  if (lowerValue * upperValue > 0) {
    return null;
  }

  for (let index = 0; index < MAX_BISECTION_ITERATIONS; index += 1) {
    const midRate = (lowerRate + upperRate) / 2;
    const midValue = calculateNpv(midRate, cashFlows);

    if (Math.abs(midValue) <= NPV_TOLERANCE || Math.abs(upperRate - lowerRate) <= RATE_TOLERANCE) {
      return midRate;
    }

    if (lowerValue * midValue > 0) {
      lowerRate = midRate;
      lowerValue = midValue;
    } else {
      upperRate = midRate;
      upperValue = midValue;
    }
  }

  return (lowerRate + upperRate) / 2;
}

export function calculateXirr(cashFlows: CashFlow[], guess = 0.1): number | null {
  const normalizedCashFlows = normalizeCashFlows(cashFlows);

  if (normalizedCashFlows.length < 2 || !hasPositiveAndNegativeFlows(normalizedCashFlows)) {
    return null;
  }

  const guesses = [guess, 0.1, 0.05, 0.2, -0.1, 0.5, 1];
  for (const initialGuess of guesses) {
    const solvedRate = tryNewtonSolve(normalizedCashFlows, initialGuess);
    if (solvedRate !== null) {
      return solvedRate;
    }
  }

  return tryBisectionSolve(normalizedCashFlows);
}

export function calculateTimeWeightedReturn(subperiodReturns: number[]): number | null {
  if (subperiodReturns.length === 0) {
    return null;
  }

  return subperiodReturns.reduce((total, subperiodReturn) => total * (1 + subperiodReturn), 1) - 1;
}

export function combinePerformanceInputs(inputs: PerformanceInput[]): PerformanceInput {
  return inputs.reduce<PerformanceInput>(
    (combined, input) => ({
      cashFlows: [...combined.cashFlows, ...input.cashFlows],
      fees: combined.fees + input.fees,
    }),
    { cashFlows: [], fees: 0 }
  );
}

export function summarizePerformance(
  input: PerformanceInput,
  endingValue: number,
  asOfDate: Date | string = new Date()
): PerformanceSummary {
  const normalizedEndingValue = Number.isFinite(endingValue) ? Math.max(endingValue, 0) : 0;
  const normalizedCashFlows = normalizeCashFlows(input.cashFlows);

  const cashIn = normalizedCashFlows
    .filter((cashFlow) => cashFlow.amount < 0)
    .reduce((total, cashFlow) => total + Math.abs(cashFlow.amount), 0);
  const cashOut = normalizedCashFlows
    .filter((cashFlow) => cashFlow.amount > 0)
    .reduce((total, cashFlow) => total + cashFlow.amount, 0);

  const absoluteProfit = cashOut + normalizedEndingValue - cashIn;
  const simpleReturnPercentage = cashIn > 0 ? (absoluteProfit / cashIn) * 100 : null;
  const performanceCashFlows =
    normalizedEndingValue > 0
      ? [...normalizedCashFlows, { date: toDate(asOfDate), amount: normalizedEndingValue }]
      : normalizedCashFlows;

  return {
    cashIn,
    cashOut,
    endingValue: normalizedEndingValue,
    fees: input.fees,
    netContributions: cashIn - cashOut,
    absoluteProfit,
    simpleReturnPercentage,
    moneyWeightedReturn: calculateXirr(performanceCashFlows),
  };
}

export function buildStockPerformanceInput(transactions: StockTransaction[]): PerformanceInput {
  return transactions.reduce<PerformanceInput>(
    (input, transaction) => {
      const fees = (transaction.brokerage || 0) + (transaction.taxes || 0);
      const amount =
        transaction.transactionType === 'BUY'
          ? -(transaction.totalAmount + fees)
          : transaction.totalAmount - fees;

      input.cashFlows.push({
        date: transaction.transactionDate,
        amount,
      });
      input.fees += fees;
      return input;
    },
    { cashFlows: [], fees: 0 }
  );
}

export function buildMutualFundPerformanceInput(
  transactions: MutualFundTransaction[]
): PerformanceInput {
  return transactions.reduce<PerformanceInput>(
    (input, transaction) => {
      const fees = calculateMfCharges(transaction.transactionType, transaction.totalAmount).total;
      const isContribution =
        transaction.transactionType === 'BUY' || transaction.transactionType === 'SIP';
      const amount = isContribution
        ? -(transaction.totalAmount + fees)
        : transaction.totalAmount - fees;

      input.cashFlows.push({
        date: transaction.transactionDate,
        amount,
      });
      input.fees += fees;
      return input;
    },
    { cashFlows: [], fees: 0 }
  );
}

export function buildBondPerformanceInput(transactions: BondTransaction[]): PerformanceInput {
  return transactions.reduce<PerformanceInput>(
    (input, transaction) => {
      const fees = calculateBondCharges(
        transaction.transactionType,
        transaction.quantity,
        transaction.price
      ).total;
      const amount =
        transaction.transactionType === 'BUY'
          ? -(transaction.totalAmount + fees)
          : transaction.totalAmount - fees;

      input.cashFlows.push({
        date: transaction.transactionDate,
        amount,
      });
      input.fees += fees;
      return input;
    },
    { cashFlows: [], fees: 0 }
  );
}

export function summarizeStockPerformance(
  transactions: StockTransaction[],
  endingValue: number,
  asOfDate?: Date | string
): PerformanceSummary {
  return summarizePerformance(buildStockPerformanceInput(transactions), endingValue, asOfDate);
}

export function summarizeMutualFundPerformance(
  transactions: MutualFundTransaction[],
  endingValue: number,
  asOfDate?: Date | string
): PerformanceSummary {
  return summarizePerformance(buildMutualFundPerformanceInput(transactions), endingValue, asOfDate);
}

export function summarizeBondPerformance(
  transactions: BondTransaction[],
  endingValue: number,
  asOfDate?: Date | string
): PerformanceSummary {
  return summarizePerformance(buildBondPerformanceInput(transactions), endingValue, asOfDate);
}
