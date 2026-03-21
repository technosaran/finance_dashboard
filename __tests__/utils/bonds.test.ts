import { calculateApproxBondYield, calculateBondPositionMetrics } from '@/lib/utils/bonds';

describe('bond utils', () => {
  it('calculates position metrics safely', () => {
    expect(calculateBondPositionMetrics(10, 950, 1020)).toEqual({
      invested: 9500,
      currentValue: 10200,
      pnl: 700,
      pnlPercentage: 7.3684,
    });
  });

  it('calculates an approximate yield to maturity when enough data is available', () => {
    const ytm = calculateApproxBondYield({
      currentPrice: 980,
      couponRate: 7.5,
      maturityDate: '2034-04-10',
      referenceDate: new Date('2026-03-21T00:00:00Z'),
    });

    expect(ytm).not.toBeNull();
    expect(ytm!).toBeGreaterThan(0);
  });

  it('returns null for invalid yield inputs', () => {
    expect(
      calculateApproxBondYield({
        currentPrice: 0,
        couponRate: 7.5,
        maturityDate: '2034-04-10',
      })
    ).toBeNull();
  });
});
