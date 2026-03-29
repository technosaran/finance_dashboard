'use client';

import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { Stock } from '@/lib/types';

interface TopHoldingsProps {
  holdings: Stock[];
}

export function TopHoldings({ holdings }: TopHoldingsProps) {
  if (holdings.length === 0) return null;

  return (
    <div
      className="fade-in glass-panel"
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* No decorative radial glow for ultra-dark look */}

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
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            <TrendingUp size={16} />
          </div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: '800',
              margin: 0,
              color: '#f8fafc',
              letterSpacing: '0.01em',
            }}
          >
            Top Holdings
          </h3>
        </div>
        <Link
          href="/stocks"
          style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
          }}
        >
          View All
        </Link>
      </div>

      {/* Holdings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(() => {
          const totalHoldingsValue = holdings.reduce((s, h) => s + h.currentValue, 0);
          return holdings.map((stock, idx) => {
            const dayChange =
              (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
            const allocationPct =
              totalHoldingsValue > 0 ? (stock.currentValue / totalHoldingsValue) * 100 : 0;
            return (
              <div
                key={stock.id}
                className="glow-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Rank indicator */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '2px',
                    background:
                      idx === 0
                        ? 'linear-gradient(to bottom, #f59e0b, #fbbf24)'
                        : idx === 1
                          ? 'linear-gradient(to bottom, #94a3b8, #cbd5e1)'
                          : idx === 2
                            ? 'linear-gradient(to bottom, #b45309, #d97706)'
                            : 'rgba(255,255,255,0.1)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />

                <div style={{ flex: 1, paddingLeft: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        color: '#fff',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {stock.symbol}
                    </span>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        fontWeight: '700',
                        color: '#475569',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                      }}
                    >
                      {stock.exchange}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
                    {stock.quantity} shares | {allocationPct.toFixed(1)}% of holdings
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '12px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
                    ₹{stock.currentValue.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      color: stock.pnl >= 0 ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      justifyContent: 'flex-end',
                      marginTop: '2px',
                    }}
                  >
                    {stock.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stock.pnlPercentage.toFixed(1)}%
                  </div>
                </div>
                {/* Day change mini badge */}
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    background:
                      dayChange >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${dayChange >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: dayChange >= 0 ? '#10b981' : '#ef4444',
                    whiteSpace: 'nowrap',
                    minWidth: '65px',
                    textAlign: 'center',
                  }}
                >
                  {dayChange >= 0 ? '+' : '-'}₹
                  {Math.abs(dayChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
