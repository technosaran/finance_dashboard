'use client';

import { formatCurrency, getCurrencyA11yLabel, type CurrencyCode } from '@/lib/utils/format';

interface MoneyValueProps {
  amount: number;
  compact?: boolean;
  currency?: CurrencyCode;
  className?: string;
  showSign?: boolean;
}

export function MoneyValue({
  amount,
  compact = false,
  currency = 'INR',
  className,
  showSign = false,
}: MoneyValueProps) {
  const fullValue = getCurrencyA11yLabel(amount, currency);

  return (
    <span
      className={className}
      title={fullValue}
      aria-label={fullValue}
      data-full-value={fullValue}
    >
      {formatCurrency(amount, { compact, currency, showSign })}
    </span>
  );
}
