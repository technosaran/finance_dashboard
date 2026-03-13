import { AppSettings } from '../types';

// ============================================================================
// Zerodha Charge Rates (as of 2025-2026)
// ============================================================================

// F&O specific rates (hardcoded to Zerodha's published rates)
const FNO_RATES = {
  // Brokerage: ₹20 per executed order or 0.03% whichever is lower
  BROKERAGE_FLAT: 20,
  BROKERAGE_PERCENT: 0.03,

  // STT
  FUTURES_STT_RATE: 0.02, // 0.02% on sell side (updated Oct 2024)
  OPTIONS_STT_RATE: 0.1, // 0.1% on sell side (on premium, updated Oct 2024)

  // Exchange Transaction Charges (NSE)
  FUTURES_TRANS_CHARGE: 0.00173, // 0.00173% of turnover
  OPTIONS_TRANS_CHARGE: 0.03503, // 0.03503% of premium turnover

  // SEBI Turnover Fee: ₹10 per crore = 0.0001%
  SEBI_CHARGE: 0.0001,

  // Stamp Duty on buy side
  FUTURES_STAMP_DUTY: 0.002, // 0.002%
  OPTIONS_STAMP_DUTY: 0.003, // 0.003%

  // GST: 18% on (brokerage + transaction charges + SEBI charges)
  GST_RATE: 18,
};

// ============================================================================
// Stock Delivery Charges (Zerodha - CNC)
// ============================================================================

export const calculateStockCharges = (
  type: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  settings: AppSettings
) => {
  const turnover = quantity * price;

  // 1. Brokerage (Zerodha: ₹0 for delivery / CNC)
  const brokerage =
    settings.brokerageType === 'flat'
      ? settings.brokerageValue
      : (turnover * settings.brokerageValue) / 100;

  // 2. STT (0.1% on both buy & sell for delivery)
  const stt = Math.round(turnover * (settings.sttRate / 100));

  // 3. Transaction Charges (NSE: 0.00297%)
  const transCharges = turnover * (settings.transactionChargeRate / 100);

  // 4. SEBI Charges (₹10 per crore = 0.0001%)
  const sebiCharges = turnover * (settings.sebiChargeRate / 100);

  // 5. Stamp Duty (0.015% on Buy only)
  const stampDuty = type === 'BUY' ? turnover * (settings.stampDutyRate / 100) : 0;

  // 6. GST (18% on Brokerage + Trans Charges + SEBI)
  const gst = (brokerage + transCharges + sebiCharges) * (settings.gstRate / 100);

  // 7. DP Charges (₹13.5 + GST = ₹15.93 per scrip on Sell only)
  const dpCharges = type === 'SELL' ? settings.dpCharges : 0;

  const totalCharges = brokerage + stt + transCharges + sebiCharges + stampDuty + gst + dpCharges;

  return {
    brokerage: Number(brokerage.toFixed(2)),
    stt: Number(stt.toFixed(2)),
    transactionCharges: Number(transCharges.toFixed(2)),
    sebiCharges: Number(sebiCharges.toFixed(2)),
    stampDuty: Number(stampDuty.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    dpCharges: Number(dpCharges.toFixed(2)),
    taxes: Number((totalCharges - brokerage).toFixed(2)),
    total: Number(totalCharges.toFixed(2)),
  };
};

// ============================================================================
// Mutual Fund Charges (Zerodha Coin - Direct MF)
// ============================================================================

export const calculateMfCharges = (type: 'BUY' | 'SELL' | 'SIP', amount: number) => {
  // Zerodha Coin: ₹0 brokerage for direct MFs
  // Stamp duty: 0.005% on Purchase/SIP only
  const stampDuty = type === 'BUY' || type === 'SIP' ? amount * 0.00005 : 0;

  return {
    stampDuty: Number(stampDuty.toFixed(2)),
    total: Number(stampDuty.toFixed(2)),
  };
};

// ============================================================================
// F&O Charges (Zerodha - Futures & Options)
// ============================================================================

/**
 * Determines if an instrument is an Option or Future based on instrument name.
 * Zerodha format: "NIFTY 22FEB 21500 CE" or "BANKNIFTY 22FEB FUT"
 */
const isOption = (instrument: string): boolean => {
  const upper = instrument.toUpperCase();
  return (
    upper.includes(' CE') ||
    upper.includes(' PE') ||
    upper.endsWith('CE') ||
    upper.endsWith('PE') ||
    upper.includes('CALL') ||
    upper.includes('PUT')
  );
};

export const calculateFnoCharges = (
  tradeType: 'BUY' | 'SELL',
  quantity: number,
  entryPrice: number,
  exitPrice: number,
  instrument: string,
  _settings: AppSettings
) => {
  const isOpt = isOption(instrument);
  const entryTurnover = quantity * entryPrice;
  const exitTurnover = quantity * exitPrice;
  const totalTurnover = entryTurnover + exitTurnover;

  // 1. Brokerage: ₹20 per order or 0.03% whichever is lower, applied on BOTH legs
  const entryBrokerage = Math.min(
    FNO_RATES.BROKERAGE_FLAT,
    entryTurnover * (FNO_RATES.BROKERAGE_PERCENT / 100)
  );
  const exitBrokerage = Math.min(
    FNO_RATES.BROKERAGE_FLAT,
    exitTurnover * (FNO_RATES.BROKERAGE_PERCENT / 100)
  );
  const brokerage = entryBrokerage + exitBrokerage;

  // 2. STT (only on sell side)
  // If tradeType is BUY, exit is Sell. If SELL, entry is Sell.
  const sellTurnover = tradeType === 'BUY' ? exitTurnover : entryTurnover;
  let stt: number;
  if (isOpt) {
    // Options: STT on sell side premium
    stt = sellTurnover * (FNO_RATES.OPTIONS_STT_RATE / 100);
  } else {
    // Futures: STT on sell side
    stt = sellTurnover * (FNO_RATES.FUTURES_STT_RATE / 100);
  }
  stt = Math.round(stt);

  // 3. Exchange Transaction Charges (on total turnover)
  const transRate = isOpt ? FNO_RATES.OPTIONS_TRANS_CHARGE : FNO_RATES.FUTURES_TRANS_CHARGE;
  const transCharges = totalTurnover * (transRate / 100);

  // 4. SEBI Charges (₹10 per crore on total turnover)
  const sebiCharges = totalTurnover * (FNO_RATES.SEBI_CHARGE / 100);

  // 5. Stamp Duty (on buy side only)
  // If tradeType is BUY, entry is Buy. If SELL, exit is Buy.
  const buyTurnover = tradeType === 'BUY' ? entryTurnover : exitTurnover;
  const stampRate = isOpt ? FNO_RATES.OPTIONS_STAMP_DUTY : FNO_RATES.FUTURES_STAMP_DUTY;
  const stampDuty = buyTurnover * (stampRate / 100);

  // 6. GST (18% on brokerage + transaction charges + SEBI charges)
  const gst = (brokerage + transCharges + sebiCharges) * (FNO_RATES.GST_RATE / 100);

  const totalCharges = brokerage + stt + transCharges + sebiCharges + stampDuty + gst;

  return {
    brokerage: Number(brokerage.toFixed(2)),
    stt: Number(stt.toFixed(2)),
    transactionCharges: Number(transCharges.toFixed(2)),
    sebiCharges: Number(sebiCharges.toFixed(2)),
    stampDuty: Number(stampDuty.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    taxes: Number((totalCharges - brokerage).toFixed(2)),
    total: Number(totalCharges.toFixed(2)),
    isOption: isOpt,
  };
};

// ============================================================================
// Bond Charges
// ============================================================================

export const calculateBondCharges = (
  type: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  settings: AppSettings
) => {
  const turnover = quantity * price;

  // Brokerage
  const brokerage =
    settings.brokerageType === 'flat'
      ? settings.brokerageValue
      : (turnover * settings.brokerageValue) / 100;

  // Stamp Duty for bonds: 0.0001%
  const stampDuty = type === 'BUY' ? turnover * 0.000001 : 0;

  // GST on brokerage (18%)
  const gst = brokerage * (settings.gstRate / 100);

  const total = brokerage + stampDuty + gst;

  return {
    brokerage: Number(brokerage.toFixed(2)),
    stampDuty: Number(stampDuty.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};
