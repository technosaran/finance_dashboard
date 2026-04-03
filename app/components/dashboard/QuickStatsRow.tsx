'use client';

import { Wallet, BarChart3, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface QuickStatsRowProps {
  liquidityINR: number;
  totalInvestment: number;
  totalUnrealizedPnl: number;
  stockDayChange: number;
  investmentPnlPercent?: number;
}

interface StatCard {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

function formatAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= CRORE) return `${sign}₹${(abs / CRORE).toFixed(2)}Cr`;
  if (abs >= LAKH) return `${sign}₹${(abs / LAKH).toFixed(2)}L`;
  if (abs >= THOUSAND) return `${sign}₹${(abs / THOUSAND).toFixed(1)}K`;

  return `${sign}₹${abs.toLocaleString()}`;
}

export function QuickStatsRow({
  liquidityINR,
  totalInvestment,
  totalUnrealizedPnl,
  stockDayChange,
  investmentPnlPercent = 0,
}: QuickStatsRowProps) {
  const stats: StatCard[] = [
    {
      label: 'Cash available',
      value: formatAmount(liquidityINR),
      subValue: 'Current balance',
      icon: <Wallet size={18} />,
      color: '#10b981',
      trend: 'neutral',
    },
    {
      label: 'Invested',
      value: formatAmount(totalInvestment),
      subValue: 'Active capital',
      icon: <BarChart3 size={18} />,
      color: '#3b82f6',
      trend: 'neutral',
    },
    {
      label: 'Unrealized P&L',
      value: `${totalUnrealizedPnl >= 0 ? '+' : ''}${formatAmount(totalUnrealizedPnl)}`,
      subValue: `${investmentPnlPercent >= 0 ? '+' : ''}${investmentPnlPercent.toFixed(2)}% overall`,
      icon: totalUnrealizedPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />,
      color: totalUnrealizedPnl >= 0 ? '#20b072' : '#ef5d5d',
      trend: totalUnrealizedPnl >= 0 ? 'up' : 'down',
    },
    {
      label: 'Today',
      value: `${stockDayChange >= 0 ? '+' : ''}${formatAmount(stockDayChange)}`,
      subValue: 'Market movement',
      icon: <TrendingUp size={18} />,
      color: stockDayChange >= 0 ? '#20b072' : '#ef5d5d',
      trend: stockDayChange >= 0 ? 'up' : 'down',
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
          key={stat.label}
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
            className="stat-value"
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
