'use client';

import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Stock } from '@/lib/types';

interface TopHoldingsProps {
  holdings: Stock[];
}

export function TopHoldings({ holdings }: TopHoldingsProps) {
  if (holdings.length === 0) return null;

  return (
    <div
      className="fade-in"
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #0a0f1e 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.04)',
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
          right: '-30px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08), transparent)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
          }}
        >
          <TrendingUp size={16} />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#e2e8f0' }}>
          Top Holdings
        </h3>
      </div>

      {/* Holdings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {holdings.map((stock) => {
          const dayChange =
            (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
          return (
            <div
              key={stock.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                  {stock.symbol}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: '600' }}>
                  {stock.exchange} • {stock.quantity} shares
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                  ₹{stock.currentValue.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: stock.pnl >= 0 ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    justifyContent: 'flex-end',
                  }}
                >
                  {stock.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stock.pnlPercentage.toFixed(1)}%
                </div>
              </div>
              {/* Day change mini badge */}
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  background:
                    dayChange >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${dayChange >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  color: dayChange >= 0 ? '#34d399' : '#f87171',
                  whiteSpace: 'nowrap',
                  minWidth: '55px',
                  textAlign: 'center',
                }}
              >
                {dayChange >= 0 ? '+' : ''}₹
                {Math.abs(dayChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
