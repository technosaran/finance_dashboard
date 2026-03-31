export type SupportedExchange = 'NSE' | 'BSE';
export type StockChargeMode = 'delivery' | 'intraday';

type StockTradeType = 'BUY' | 'SELL';
type MutualFundTradeType = 'BUY' | 'SELL' | 'SIP';
type FnoTradeType = 'BUY' | 'SELL';

const GST_RATE = 18;
const SEBI_TURNOVER_RATE = 0.0001;

const STOCK_DELIVERY_RATES = {
  brokerage: 0,
  sttBuy: 0.1,
  sttSell: 0.1,
  transactionCharges: {
    NSE: 0.00307,
    BSE: 0.00375,
  } satisfies Record<SupportedExchange, number>,
  stampDuty: 0.015,
  dpCharges: 15.34,
};

const STOCK_INTRADAY_RATES = {
  brokeragePercent: 0.03,
  brokerageCap: 20,
  sttSell: 0.025,
  transactionCharges: {
    NSE: 0.00307,
    BSE: 0.00375,
  } satisfies Record<SupportedExchange, number>,
  stampDuty: 0.003,
  dpCharges: 0,
};

const MUTUAL_FUND_RATES = {
  stampDuty: 0.005,
};

const FNO_RATES = {
  futuresBrokeragePercent: 0.03,
  futuresBrokerageCap: 20,
  optionsBrokeragePerOrder: 20,
  futuresStt: 0.05,
  optionsStt: 0.15,
  futuresTransactionCharges: 0.00183,
  optionsTransactionCharges: 0.03553,
  futuresStampDuty: 0.002,
  optionsStampDuty: 0.003,
};

const round2 = (value: number) => Number(value.toFixed(2));

const normalizeExchange = (exchange?: string): SupportedExchange =>
  exchange?.toUpperCase() === 'BSE' ? 'BSE' : 'NSE';

const isOptionInstrument = (instrument: string): boolean => {
  const upper = instrument.toUpperCase();
  return (
    upper.includes(' CE') ||
    upper.includes(' PE') ||
    upper.endsWith('CE') ||
    upper.endsWith('PE') ||
    upper.includes(' CALL') ||
    upper.includes(' PUT')
  );
};

export const getStockChargeMeta = (exchange?: string, mode: StockChargeMode = 'delivery') => {
  const normalizedExchange = normalizeExchange(exchange);
  const isIntraday = mode === 'intraday';

  return {
    mode,
    exchange: normalizedExchange,
    brokerageLabel: isIntraday ? '0.03% or ₹20 per executed order' : '₹0 delivery brokerage',
    sttRate: isIntraday ? STOCK_INTRADAY_RATES.sttSell : STOCK_DELIVERY_RATES.sttSell,
    transactionChargeRate: isIntraday
      ? STOCK_INTRADAY_RATES.transactionCharges[normalizedExchange]
      : STOCK_DELIVERY_RATES.transactionCharges[normalizedExchange],
    stampDutyRate: isIntraday ? STOCK_INTRADAY_RATES.stampDuty : STOCK_DELIVERY_RATES.stampDuty,
    sebiChargeRate: SEBI_TURNOVER_RATE,
    dpCharges: isIntraday ? STOCK_INTRADAY_RATES.dpCharges : STOCK_DELIVERY_RATES.dpCharges,
    gstRate: GST_RATE,
  };
};

export const calculateStockCharges = (
  type: StockTradeType,
  quantity: number,
  price: number,
  exchange?: string,
  mode: StockChargeMode = 'delivery'
) => {
  const normalizedExchange = normalizeExchange(exchange);
  const isIntraday = mode === 'intraday';
  const turnover = quantity * price;
  const brokerage = isIntraday
    ? Math.min(
        STOCK_INTRADAY_RATES.brokerageCap,
        turnover * (STOCK_INTRADAY_RATES.brokeragePercent / 100)
      )
    : STOCK_DELIVERY_RATES.brokerage;
  const sttRate =
    type === 'BUY'
      ? isIntraday
        ? 0
        : STOCK_DELIVERY_RATES.sttBuy
      : isIntraday
        ? STOCK_INTRADAY_RATES.sttSell
        : STOCK_DELIVERY_RATES.sttSell;
  const stt = Math.round(turnover * (sttRate / 100));
  const transactionCharges =
    turnover *
    ((isIntraday
      ? STOCK_INTRADAY_RATES.transactionCharges[normalizedExchange]
      : STOCK_DELIVERY_RATES.transactionCharges[normalizedExchange]) /
      100);
  const sebiCharges = turnover * (SEBI_TURNOVER_RATE / 100);
  const stampDuty =
    type === 'BUY'
      ? turnover *
        ((isIntraday ? STOCK_INTRADAY_RATES.stampDuty : STOCK_DELIVERY_RATES.stampDuty) / 100)
      : 0;
  const gst = (brokerage + transactionCharges + sebiCharges) * (GST_RATE / 100);
  const dpCharges =
    type === 'SELL' && !isIntraday
      ? STOCK_DELIVERY_RATES.dpCharges
      : STOCK_INTRADAY_RATES.dpCharges;
  const total = brokerage + stt + transactionCharges + sebiCharges + stampDuty + gst + dpCharges;

  return {
    mode,
    exchange: normalizedExchange,
    turnover: round2(turnover),
    brokerage: round2(brokerage),
    stt: round2(stt),
    transactionCharges: round2(transactionCharges),
    sebiCharges: round2(sebiCharges),
    stampDuty: round2(stampDuty),
    gst: round2(gst),
    dpCharges: round2(dpCharges),
    taxes: round2(total - brokerage),
    total: round2(total),
    settlementAmount: round2(type === 'BUY' ? turnover + total : turnover - total),
  };
};

export const getMfChargeMeta = () => ({
  stampDutyRate: MUTUAL_FUND_RATES.stampDuty,
  platformLabel: 'Zerodha Coin direct mutual funds',
});

export const calculateMfCharges = (type: MutualFundTradeType, amount: number) => {
  const stampDuty =
    type === 'BUY' || type === 'SIP' ? amount * (MUTUAL_FUND_RATES.stampDuty / 100) : 0;

  return {
    stampDuty: round2(stampDuty),
    total: round2(stampDuty),
    effectiveInvestment: round2(amount - stampDuty),
  };
};

export const getFnoChargeMeta = (instrument: string) => {
  const isOption = isOptionInstrument(instrument);

  return {
    isOption,
    brokerageLabel: isOption
      ? '₹20 per executed order'
      : '0.03% or ₹20 per executed order, whichever is lower',
    sttRate: isOption ? FNO_RATES.optionsStt : FNO_RATES.futuresStt,
    transactionChargeRate: isOption
      ? FNO_RATES.optionsTransactionCharges
      : FNO_RATES.futuresTransactionCharges,
    stampDutyRate: isOption ? FNO_RATES.optionsStampDuty : FNO_RATES.futuresStampDuty,
    sebiChargeRate: SEBI_TURNOVER_RATE,
    gstRate: GST_RATE,
  };
};

export const calculateFnoCharges = (
  tradeType: FnoTradeType,
  quantity: number,
  entryPrice: number,
  exitPrice: number,
  instrument: string
) => {
  const isOption = isOptionInstrument(instrument);
  const entryTurnover = quantity * entryPrice;
  const exitTurnover = quantity * exitPrice;
  const totalTurnover = entryTurnover + exitTurnover;

  const entryBrokerage = isOption
    ? FNO_RATES.optionsBrokeragePerOrder
    : Math.min(
        FNO_RATES.futuresBrokerageCap,
        entryTurnover * (FNO_RATES.futuresBrokeragePercent / 100)
      );
  const exitBrokerage = isOption
    ? FNO_RATES.optionsBrokeragePerOrder
    : Math.min(
        FNO_RATES.futuresBrokerageCap,
        exitTurnover * (FNO_RATES.futuresBrokeragePercent / 100)
      );
  const brokerage = entryBrokerage + exitBrokerage;

  const sellTurnover = tradeType === 'BUY' ? exitTurnover : entryTurnover;
  const sttRate = isOption ? FNO_RATES.optionsStt : FNO_RATES.futuresStt;
  const stt = Math.round(sellTurnover * (sttRate / 100));

  const transactionRate = isOption
    ? FNO_RATES.optionsTransactionCharges
    : FNO_RATES.futuresTransactionCharges;
  const transactionCharges = totalTurnover * (transactionRate / 100);
  const sebiCharges = totalTurnover * (SEBI_TURNOVER_RATE / 100);

  const buyTurnover = tradeType === 'BUY' ? entryTurnover : exitTurnover;
  const stampDutyRate = isOption ? FNO_RATES.optionsStampDuty : FNO_RATES.futuresStampDuty;
  const stampDuty = buyTurnover * (stampDutyRate / 100);

  const gst = (brokerage + transactionCharges + sebiCharges) * (GST_RATE / 100);
  const total = brokerage + stt + transactionCharges + sebiCharges + stampDuty + gst;

  return {
    isOption,
    turnover: round2(totalTurnover),
    brokerage: round2(brokerage),
    stt: round2(stt),
    transactionCharges: round2(transactionCharges),
    sebiCharges: round2(sebiCharges),
    stampDuty: round2(stampDuty),
    gst: round2(gst),
    taxes: round2(total - brokerage),
    total: round2(total),
  };
};

export const calculateBondCharges = (type: 'BUY' | 'SELL', quantity: number, price: number) => {
  const turnover = quantity * price;
  const brokerage = 0;
  const stampDuty = type === 'BUY' ? turnover * 0.000001 : 0;
  const gst = 0;
  const total = brokerage + stampDuty + gst;

  return {
    turnover: round2(turnover),
    brokerage: round2(brokerage),
    stampDuty: round2(stampDuty),
    gst: round2(gst),
    total: round2(total),
  };
};
