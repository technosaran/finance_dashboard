import {
  calculateFnoCharges,
  calculateMfCharges,
  calculateStockCharges,
} from '@/lib/utils/charges';

describe('calculateStockCharges', () => {
  it('applies Zerodha NSE delivery buy charges internally', () => {
    const charges = calculateStockCharges('BUY', 10, 100, 'NSE');

    expect(charges.brokerage).toBe(0);
    expect(charges.stt).toBe(1);
    expect(charges.transactionCharges).toBe(0.03);
    expect(charges.stampDuty).toBe(0.15);
    expect(charges.total).toBe(1.19);
    expect(charges.settlementAmount).toBe(1001.19);
  });

  it('applies Zerodha BSE delivery sell charges including DP', () => {
    const charges = calculateStockCharges('SELL', 10, 500, 'BSE');

    expect(charges.exchange).toBe('BSE');
    expect(charges.stt).toBe(5);
    expect(charges.dpCharges).toBe(15.34);
    expect(charges.total).toBe(20.57);
    expect(charges.settlementAmount).toBe(4979.43);
  });
});

describe('calculateMfCharges', () => {
  it('applies Coin stamp duty on mutual fund buy orders', () => {
    const charges = calculateMfCharges('BUY', 10000);

    expect(charges.stampDuty).toBe(0.5);
    expect(charges.effectiveInvestment).toBe(9999.5);
    expect(charges.total).toBe(0.5);
  });

  it('does not apply charges on mutual fund redemption', () => {
    const charges = calculateMfCharges('SELL', 10000);

    expect(charges.stampDuty).toBe(0);
    expect(charges.effectiveInvestment).toBe(10000);
    expect(charges.total).toBe(0);
  });
});

describe('calculateFnoCharges', () => {
  it('calculates Zerodha futures round-trip charges', () => {
    const charges = calculateFnoCharges('BUY', 50, 100, 110, 'NIFTY APR FUT');

    expect(charges.isOption).toBe(false);
    expect(charges.brokerage).toBe(3.15);
    expect(charges.stt).toBe(3);
    expect(charges.transactionCharges).toBe(0.19);
    expect(charges.total).toBe(7.06);
  });

  it('uses flat brokerage for option trades', () => {
    const charges = calculateFnoCharges('SELL', 75, 100, 80, 'NIFTY APR 22000 CE');

    expect(charges.isOption).toBe(true);
    expect(charges.brokerage).toBe(40);
    expect(charges.stt).toBe(11);
    expect(charges.transactionCharges).toBe(4.8);
    expect(charges.total).toBe(64.06);
  });
});
