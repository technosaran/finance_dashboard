'use client';

import Link from 'next/link';
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ShoppingCart,
  DollarSign,
  Repeat,
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import {
  getTransactionSemanticLabel,
  isTransferTransaction,
  isIncomeTransaction,
} from '@/lib/utils/transactions';
import { MoneyValue } from '@/app/components/ui/MoneyValue';

interface RecentActivityProps {
  transactions: Transaction[];
  compactNumbers?: boolean;
}

function getCategoryIcon(transaction: Transaction) {
  if (isIncomeTransaction(transaction)) return <DollarSign size={14} />;
  if (isTransferTransaction(transaction)) return <Repeat size={14} />;

  const category = String(transaction.category).toLowerCase();
  if (category.includes('food') || category.includes('dining') || category.includes('restaurant')) {
    return <ShoppingCart size={14} />;
  }

  if (category.includes('transport') || category.includes('travel') || category.includes('fuel')) {
    return <ArrowDownRight size={14} />;
  }

  if (category.includes('shop') || category.includes('clothing') || category.includes('fashion')) {
    return <ShoppingCart size={14} />;
  }

  return <ArrowDownRight size={14} />;
}

export function RecentActivity({ transactions, compactNumbers = false }: RecentActivityProps) {
  if (transactions.length === 0) return null;

  return (
    <div
      className="fade-in glass-panel"
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#e2e8f0' }}>
            Recent Activity
          </h3>
        </div>
        <Link
          href="/ledger"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
            transition: 'all 0.2s',
          }}
        >
          View All <ChevronRight size={12} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {transactions.map((transaction) => {
          const isPositive = transaction.type === 'Income';

          return (
            <div
              key={transaction.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isPositive ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPositive ? '#34d399' : '#f87171',
                  flexShrink: 0,
                }}
              >
                {getCategoryIcon(transaction)}
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#e2e8f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {transaction.description}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#475569',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '2px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    {getTransactionSemanticLabel(transaction.transactionType)}
                  </span>
                  <span>{String(transaction.category)}</span>
                  <span>{formatDate(transaction.date)}</span>
                </div>
              </div>

              <div
                className="table-nums"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  color: isPositive ? '#34d399' : '#f87171',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <MoneyValue
                  amount={transaction.amount}
                  compact={compactNumbers}
                  showSign={isPositive}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
