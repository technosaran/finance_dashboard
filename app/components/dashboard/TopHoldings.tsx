'use client';

import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Stock } from '@/lib/types';

interface TopHoldingsProps {
  holdings: Stock[];
}

export function TopHoldings({ holdings }: TopHoldingsProps) {
  if (holdings.length === 0) return null;

  const totalHoldingsValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);

  return (
    <div className="glass-panel ios-section-card fade-in">
      <div className="ios-section-header">
        <div className="ios-section-title">
          <div
            className="ios-section-icon"
            style={{
              color: '#89dbff',
              background: 'rgba(137, 219, 255, 0.14)',
              borderColor: 'rgba(137, 219, 255, 0.24)',
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="ios-section-label">Top Holdings</div>
            <div className="ios-section-subtitle">Largest listed positions by live value</div>
          </div>
        </div>

        <Link href="/stocks" className="ios-ghost-link">
          View all
        </Link>
      </div>

      <div className="ios-list">
        {holdings.map((stock) => {
          const dayChange =
            (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
          const allocationPct =
            totalHoldingsValue > 0 ? (stock.currentValue / totalHoldingsValue) * 100 : 0;
          const isPositive = stock.pnl >= 0;

          return (
            <div key={stock.id} className="ios-list-row">
              <div className="ios-list-row__main">
                <div
                  className="ios-list-row__icon"
                  style={{
                    background: `${isPositive ? '#8de7ca' : '#fda4af'}22`,
                    borderColor: `${isPositive ? '#8de7ca' : '#fda4af'}33`,
                    color: isPositive ? '#8de7ca' : '#fda4af',
                  }}
                >
                  {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    className="ios-list-row__title"
                    style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    <span>{stock.symbol}</span>
                    <span
                      className="ios-badge"
                      style={{ minHeight: '22px', padding: '0 8px', fontSize: '0.64rem' }}
                    >
                      {stock.exchange}
                    </span>
                  </div>
                  <div className="ios-list-row__meta">
                    {stock.quantity} shares | {allocationPct.toFixed(1)}% of tracked holdings
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <div className="ios-list-row__value">
                    Rs {stock.currentValue.toLocaleString('en-IN')}
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      color: isPositive ? '#8de7ca' : '#fda4af',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      textAlign: 'right',
                    }}
                  >
                    {stock.pnlPercentage.toFixed(1)}%
                  </div>
                </div>

                <div
                  className="ios-list-row__pill"
                  style={{
                    color: dayChange >= 0 ? '#8de7ca' : '#fda4af',
                    background:
                      dayChange >= 0 ? 'rgba(110, 231, 183, 0.12)' : 'rgba(253, 164, 175, 0.12)',
                    borderColor:
                      dayChange >= 0 ? 'rgba(110, 231, 183, 0.22)' : 'rgba(253, 164, 175, 0.22)',
                  }}
                >
                  {dayChange >= 0 ? '+' : '-'}Rs{' '}
                  {Math.abs(dayChange).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
