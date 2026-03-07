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
    <div
      className="fade-in glass-panel"
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '-30px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
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
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
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
            color: '#6366f1',
            textDecoration: 'none',
            padding: '5px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            background: 'rgba(99, 102, 241, 0.05)',
            transition: 'all 0.2s',
          }}
        >
          View All <ChevronRight size={12} />
        </Link>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              background:
                tx.type === 'Income' ? 'rgba(52, 211, 153, 0.03)' : 'rgba(255,255,255,0.02)',
              border:
                tx.type === 'Income'
                  ? '1px solid rgba(52, 211, 153, 0.08)'
                  : '1px solid rgba(255,255,255,0.03)',
              transition: 'background 0.2s',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background:
                  tx.type === 'Income' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tx.type === 'Income' ? '#34d399' : '#f87171',
                flexShrink: 0,
              }}
            >
              {getCategoryIcon(tx.type, tx.category)}
            </div>

            {/* Details */}
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
                {tx.description}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#475569',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  {tx.category}
                </span>
                <span>•</span>
                {new Date(tx.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>

            {/* Amount */}
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: '800',
                color: tx.type === 'Income' ? '#34d399' : '#f87171',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
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
