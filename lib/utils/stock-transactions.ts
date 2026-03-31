import { roundTo } from './number';

export type StockTradeType = 'BUY' | 'SELL';

export interface StockTradeValidationResult {
  isValid: boolean;
  message?: string;
  shortfall?: number;
}

const normalizeAmount = (value: number) => (Number.isFinite(value) ? value : 0);

export const calculateStockTradeChargesTotal = (brokerage: number = 0, taxes: number = 0) =>
  roundTo(normalizeAmount(brokerage) + normalizeAmount(taxes));

export const calculateStockTradeSettlement = (
  transactionType: StockTradeType,
  grossAmount: number,
  brokerage: number = 0,
  taxes: number = 0
) => {
  const safeGrossAmount = normalizeAmount(grossAmount);
  const totalCharges = calculateStockTradeChargesTotal(brokerage, taxes);

  return roundTo(
    transactionType === 'BUY' ? safeGrossAmount + totalCharges : safeGrossAmount - totalCharges
  );
};

export const validateStockTrade = ({
  transactionType,
  quantity,
  availableQuantity,
  settlementAmount,
  accountBalance,
}: {
  transactionType: StockTradeType;
  quantity: number;
  availableQuantity?: number | null;
  settlementAmount?: number | null;
  accountBalance?: number | null;
}): StockTradeValidationResult => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      isValid: false,
      message: 'Quantity must be greater than zero.',
    };
  }

  if (
    transactionType === 'SELL' &&
    Number.isFinite(availableQuantity) &&
    quantity > Number(availableQuantity)
  ) {
    return {
      isValid: false,
      message: `You only have ${roundTo(Number(availableQuantity), 4)} shares available to sell.`,
    };
  }

  if (
    transactionType === 'BUY' &&
    Number.isFinite(settlementAmount) &&
    Number.isFinite(accountBalance) &&
    Number(accountBalance) < Number(settlementAmount)
  ) {
    return {
      isValid: false,
      message: 'Insufficient account balance for this order.',
      shortfall: roundTo(Number(settlementAmount) - Number(accountBalance)),
    };
  }

  return { isValid: true };
};
