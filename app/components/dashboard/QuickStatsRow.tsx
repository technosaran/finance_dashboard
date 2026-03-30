'use client';

import type { ReactNode } from 'react';
import { Wallet, BarChart3, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { MoneyValue } from '@/app/components/ui/MoneyValue';
import { InfoHint } from '@/app/components/ui/InfoHint';

interface QuickStatsRowProps {
  liquidityINR: number;
  totalInvestment: number;
  totalUnrealizedPnl: number;
  todayMovement: number;
  investmentPnlPercent?: number;
  compactNumbers?: boolean;
}

interface StatCard {
  label: ReactNode;
  value: ReactNode;
  subValue?: string;
  icon: ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function QuickStatsRow({
  liquidityINR,
  totalInvestment,
  totalUnrealizedPnl,
  todayMovement,
  investmentPnlPercent = 0,
  compactNumbers = false,
}: QuickStatsRowProps) {
  const stats: StatCard[] = [
    {
      label: (
        <InfoHint
          label="Cash available"
          description="Cash and liquid account balances available right now."
        />
      ),
      value: <MoneyValue amount={liquidityINR} compact={compactNumbers} />,
      subValue: 'Current balance',
      icon: <Wallet size={18} />,
      color: '#6bb99d',
      trend: 'neutral',
    },
    {
      label: (
        <InfoHint
          label="Invested"
          description="Capital currently deployed across stocks, mutual funds, bonds, and open positions."
        />
      ),
      value: <MoneyValue amount={totalInvestment} compact={compactNumbers} />,
      subValue: 'Active capital',
      icon: <BarChart3 size={18} />,
      color: '#20b072',
      trend: 'neutral',
    },
    {
      label: (
        <InfoHint
          label="Unrealized P&L"
          description="Paper gains or losses on holdings you still own. Nothing is booked until you sell."
        />
      ),
      value: (
        <MoneyValue
          amount={totalUnrealizedPnl}
          compact={compactNumbers}
          showSign={totalUnrealizedPnl >= 0}
        />
      ),
      subValue: `${investmentPnlPercent >= 0 ? '+' : ''}${investmentPnlPercent.toFixed(2)}% overall`,
      icon: totalUnrealizedPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />,
      color: totalUnrealizedPnl >= 0 ? '#20b072' : '#ef5d5d',
      trend: totalUnrealizedPnl >= 0 ? 'up' : 'down',
    },
    {
      label: (
        <InfoHint
          label="Today"
          description="Today's mark-to-market movement across supported live-priced investments."
        />
      ),
      value: (
        <MoneyValue amount={todayMovement} compact={compactNumbers} showSign={todayMovement >= 0} />
      ),
      subValue: 'Market movement',
      icon: <TrendingUp size={18} />,
      color: todayMovement >= 0 ? '#20b072' : '#ef5d5d',
      trend: todayMovement >= 0 ? 'up' : 'down',
    },
  ];

  const animationDelays = ['0s', '0.07s', '0.14s', '0.21s'];

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}
    >
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="fade-in premium-card"
          style={{
            animationDelay: animationDelays[idx] ?? '0s',
            padding: '22px',
            borderRadius: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: `${stat.color}18`,
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </div>
            <span
              style={{
                fontSize: '0.73rem',
                fontWeight: '800',
                color: '#9aaea9',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {stat.label}
            </span>
          </div>

          <div
            className="stat-value table-nums"
            style={{
              fontSize: 'clamp(1.05rem, 3vw, 1.35rem)',
              fontWeight: '900',
              color: stat.trend !== 'neutral' ? stat.color : '#fff',
              letterSpacing: '-0.02em',
              background: stat.trend !== 'neutral' ? 'none' : undefined,
              WebkitTextFillColor: stat.trend !== 'neutral' ? 'currentColor' : undefined,
            }}
          >
            {stat.value}
          </div>

          {stat.subValue && (
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                color: stat.trend !== 'neutral' ? stat.color : '#6f8480',
                marginTop: '6px',
              }}
            >
              {stat.subValue}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
