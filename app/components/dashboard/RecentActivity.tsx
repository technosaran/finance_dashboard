'use client';

import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  Repeat,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Car,
} from 'lucide-react';
import { Transaction } from '@/lib/types';

interface RecentActivityProps {
  transactions: Transaction[];
}

function getCategoryIcon(type: string, category: string) {
  if (type === 'Income') return <DollarSign size={14} />;

  const normalized = category.toLowerCase();

  if (
    normalized.includes('food') ||
    normalized.includes('dining') ||
    normalized.includes('restaurant')
  ) {
    return <UtensilsCrossed size={14} />;
  }

  if (
    normalized.includes('transport') ||
    normalized.includes('travel') ||
    normalized.includes('fuel')
  ) {
    return <Car size={14} />;
  }

  if (
    normalized.includes('shop') ||
    normalized.includes('clothing') ||
    normalized.includes('fashion')
  ) {
    return <ShoppingCart size={14} />;
  }

  if (normalized.includes('transfer')) return <Repeat size={14} />;

  return <ArrowDownRight size={14} />;
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="glass-panel ios-section-card fade-in">
      <div className="ios-section-header">
        <div className="ios-section-title">
          <div
            className="ios-section-icon"
            style={{
              color: '#d8cdff',
              background: 'rgba(216, 205, 255, 0.14)',
              borderColor: 'rgba(216, 205, 255, 0.24)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div className="ios-section-label">Recent Activity</div>
            <div className="ios-section-subtitle">Latest money movement across your ledger</div>
          </div>
        </div>

        <Link href="/ledger" className="ios-ghost-link">
          View all
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="ios-list">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === 'Income';

          return (
            <div key={transaction.id} className="ios-list-row">
              <div className="ios-list-row__main">
                <div
                  className="ios-list-row__icon"
                  style={{
                    background: isIncome
                      ? 'rgba(110, 231, 183, 0.14)'
                      : 'rgba(253, 164, 175, 0.14)',
                    borderColor: isIncome
                      ? 'rgba(110, 231, 183, 0.24)'
                      : 'rgba(253, 164, 175, 0.24)',
                    color: isIncome ? '#8de7ca' : '#fda4af',
                  }}
                >
                  {getCategoryIcon(transaction.type, transaction.category)}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div className="ios-list-row__title">{transaction.description}</div>
                  <div className="ios-list-row__meta">
                    {transaction.category} |{' '}
                    {new Date(transaction.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>

              <div
                className="ios-list-row__value"
                style={{ color: isIncome ? '#8de7ca' : '#fda4af' }}
              >
                {isIncome ? (
                  <ArrowUpRight size={14} style={{ verticalAlign: 'middle' }} />
                ) : (
                  <ArrowDownRight size={14} style={{ verticalAlign: 'middle' }} />
                )}{' '}
                Rs {transaction.amount.toLocaleString('en-IN')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
