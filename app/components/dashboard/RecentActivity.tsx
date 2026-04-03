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

interface RecentActivityProps {
  transactions: Transaction[];
}

function getCategoryIcon(type: string, category: string) {
  if (type === 'Income') return <DollarSign size={14} />;
  const cat = category.toLowerCase();
  if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant'))
    return <span style={{ fontSize: '14px' }}>🍽️</span>;
  if (cat.includes('transport') || cat.includes('travel') || cat.includes('fuel'))
    return <span style={{ fontSize: '14px' }}>🚗</span>;
  if (cat.includes('shop') || cat.includes('clothing') || cat.includes('fashion'))
    return <ShoppingCart size={14} />;
  if (cat.includes('transfer')) return <Repeat size={14} />;
  return <ArrowDownRight size={14} />;
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="fade-in glass-panel panel-padded">
      {/* No decorative radial glow for ultra-dark look */}

      {/* Header */}
      <div className="ra-header">
        <div className="ra-header-left">
          <div className="panel-icon-box">
            <Sparkles size={16} />
          </div>
          <h3 className="ra-title">Recent Activity</h3>
        </div>
        <Link href="/ledger" className="panel-view-all">
          View All <ChevronRight size={12} />
        </Link>
      </div>

      {/* Transaction List */}
      <div className="ra-tx-list">
        {transactions.map((tx) => (
          <div key={tx.id} className="ra-tx-row">
            {/* Icon */}
            <div
              className={`ra-tx-icon-base ${tx.type === 'Income' ? 'ra-tx-icon-income' : 'ra-tx-icon-expense'}`}
            >
              {getCategoryIcon(tx.type, tx.category)}
            </div>

            {/* Details */}
            <div className="ra-tx-details">
              <div className="ra-tx-description">{tx.description}</div>
              <div className="ra-tx-meta">
                <span className="ra-tx-category-badge">{tx.category}</span>
                <span>|</span>
                {new Date(tx.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>

            {/* Amount */}
            <div
              className={`ra-tx-amount ${tx.type === 'Income' ? 'ra-tx-amount-income' : 'ra-tx-amount-expense'}`}
            >
              {tx.type === 'Income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}₹
              {tx.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
