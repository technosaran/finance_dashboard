export interface BondPositionMetrics {
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
}

function roundTo(value: number, decimals: number = 2): number {
  return Number(value.toFixed(decimals));
}

export function calculateBondPositionMetrics(
  quantity: number,
  avgPrice: number,
  currentPrice: number
): BondPositionMetrics {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const safeAvgPrice = Number.isFinite(avgPrice) && avgPrice >= 0 ? avgPrice : 0;
  const safeCurrentPrice =
    Number.isFinite(currentPrice) && currentPrice >= 0 ? currentPrice : safeAvgPrice;

  const invested = safeQuantity * safeAvgPrice;
  const currentValue = safeQuantity * safeCurrentPrice;
  const pnl = currentValue - invested;

  return {
    invested: roundTo(invested),
    currentValue: roundTo(currentValue),
    pnl: roundTo(pnl),
    pnlPercentage: invested > 0 ? roundTo((pnl / invested) * 100, 4) : 0,
  };
}

interface ApproxBondYieldOptions {
  currentPrice: number;
  couponRate: number;
  maturityDate: string;
  faceValue?: number;
  referenceDate?: Date;
}

export function calculateApproxBondYield({
  currentPrice,
  couponRate,
  maturityDate,
  faceValue = 1000,
  referenceDate = new Date(),
}: ApproxBondYieldOptions): number | null {
  if (
    !Number.isFinite(currentPrice) ||
    currentPrice <= 0 ||
    !Number.isFinite(couponRate) ||
    couponRate < 0 ||
    !Number.isFinite(faceValue) ||
    faceValue <= 0 ||
    !maturityDate
  ) {
    return null;
  }

  const maturity = new Date(`${maturityDate}T00:00:00`);
  if (Number.isNaN(maturity.getTime())) {
    return null;
  }

  const yearsToMaturity = Math.max(
    (maturity.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    0
  );
  const annualCoupon = (couponRate / 100) * faceValue;

  if (yearsToMaturity === 0) {
    return roundTo((annualCoupon / currentPrice) * 100);
  }

  const approximateYtm =
    ((annualCoupon + (faceValue - currentPrice) / yearsToMaturity) /
      ((faceValue + currentPrice) / 2)) *
    100;

  return roundTo(approximateYtm);
}
