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
    <div className="fade-in glass-panel panel-padded">
      {/* No decorative radial glow for ultra-dark look */}

      {/* Header */}
      <div className="th-header">
        <div className="th-header-left">
          <div className="panel-icon-box">
            <TrendingUp size={16} />
          </div>
          <h3 className="th-title">Top Holdings</h3>
        </div>
        <Link href="/stocks" className="panel-view-all">
          View All
        </Link>
      </div>

      {/* Holdings List */}
      <div className="th-holdings-list">
        {(() => {
          const totalHoldingsValue = holdings.reduce((s, h) => s + h.currentValue, 0);
          return holdings.map((stock, idx) => {
            const dayChange =
              (stock.currentPrice - (stock.previousPrice ?? stock.currentPrice)) * stock.quantity;
            const allocationPct =
              totalHoldingsValue > 0 ? (stock.currentValue / totalHoldingsValue) * 100 : 0;
            return (
              <div key={stock.id} className="glow-hover th-holding-row">
                {/* Rank indicator */}
                <div
                  className={`rank-badge ${
                    idx === 0
                      ? 'rank-badge-gold'
                      : idx === 1
                        ? 'rank-badge-silver'
                        : idx === 2
                          ? 'rank-badge-bronze'
                          : 'rank-badge-default'
                  }`}
                />

                <div className="th-holding-info">
                  <div className="th-symbol-row">
                    <span className="th-symbol">{stock.symbol}</span>
                    <span className="th-exchange-badge">{stock.exchange}</span>
                  </div>
                  <div className="th-subtext">
                    {stock.quantity} shares | {allocationPct.toFixed(1)}% of holdings
                  </div>
                </div>
                <div className="th-value-col">
                  <div className="th-value">₹{stock.currentValue.toLocaleString()}</div>
                  <div
                    className={`th-pnl-row ${stock.pnl >= 0 ? 'th-pnl-positive' : 'th-pnl-negative'}`}
                  >
                    {stock.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stock.pnlPercentage.toFixed(1)}%
                  </div>
                </div>
                {/* Day change mini badge */}
                <div
                  className={`th-day-badge ${dayChange >= 0 ? 'th-day-badge-positive' : 'th-day-badge-negative'}`}
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
